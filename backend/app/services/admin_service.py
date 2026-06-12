from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any
from bson import ObjectId
from app.database import get_db
from app.schemas.admin import (
    AdminStatsResponse, RiskDistributionResponse, 
    UserListItem, UserListResponse,
    AssessmentListItem, AssessmentListResponse
)


class AdminService:
    @staticmethod
    async def get_stats() -> AdminStatsResponse:
        db = get_db()
        
        # Total users
        total_users = await db.users.count_documents({})
        
        # Total assessments
        total_assessments = await db.assessments.count_documents({})
        
        # Assessments today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        assessments_today = await db.assessments.count_documents({
            "created_at": {"$gte": today_start}
        })
        
        # Active users today (users who took an assessment today)
        active_users_today = len(await db.assessments.distinct(
            "user_id", {"created_at": {"$gte": today_start}}
        ))
        
        # Average scores
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "avg_depression": {"$avg": "$depression_score"},
                    "avg_anxiety": {"$avg": "$anxiety_score"},
                    "avg_stress": {"$avg": "$stress_score"}
                }
            }
        ]
        
        avg_result = await db.assessments.aggregate(pipeline).to_list(length=1)
        
        if avg_result:
            avg_depression = round(avg_result[0].get("avg_depression", 0), 1)
            avg_anxiety = round(avg_result[0].get("avg_anxiety", 0), 1)
            avg_stress = round(avg_result[0].get("avg_stress", 0), 1)
        else:
            avg_depression = avg_anxiety = avg_stress = 0.0
        
        return AdminStatsResponse(
            total_users=total_users,
            total_assessments=total_assessments,
            assessments_today=assessments_today,
            average_depression_score=avg_depression,
            average_anxiety_score=avg_anxiety,
            average_stress_score=avg_stress,
            active_users_today=active_users_today
        )
    
    @staticmethod
    async def get_risk_distribution() -> RiskDistributionResponse:
        db = get_db()
        
        scales = ["depression", "anxiety", "stress"]
        distribution = {}
        
        for scale in scales:
            pipeline = [
                {
                    "$group": {
                        "_id": f"${scale}_severity",
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            results = await db.assessments.aggregate(pipeline).to_list(length=None)
            
            # Initialize all severity levels with 0
            scale_dist = {"Normal": 0, "Mild": 0, "Moderate": 0, "Severe": 0, "Extremely Severe": 0}
            for r in results:
                severity = r["_id"]
                if severity in scale_dist:
                    scale_dist[severity] = r["count"]
            
            distribution[scale] = scale_dist
        
        return RiskDistributionResponse(
            depression=distribution["depression"],
            anxiety=distribution["anxiety"],
            stress=distribution["stress"]
        )
    
    @staticmethod
    async def get_users(skip: int = 0, limit: int = 50) -> UserListResponse:
        db = get_db()
        
        total = await db.users.count_documents({})
        
        cursor = db.users.find({}).skip(skip).limit(limit).sort("created_at", -1)
        
        users = []
        async for doc in cursor:
            # Count assessments for each user
            assessment_count = await db.assessments.count_documents(
                {"user_id": doc["_id"]}
            )
            
            users.append(UserListItem(
                id=str(doc["_id"]),
                email=doc["email"],
                full_name=doc["full_name"],
                role=doc.get("role", "user"),
                created_at=doc.get("created_at"),
                assessment_count=assessment_count
            ))
        
        return UserListResponse(users=users, total=total)
    
    @staticmethod
    async def get_all_assessments(skip: int = 0, limit: int = 100) -> AssessmentListResponse:
        db = get_db()
        
        total = await db.assessments.count_documents({})
        
        pipeline = [
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }
            },
            {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}}
        ]
        
        results = await db.assessments.aggregate(pipeline).to_list(length=None)
        
        assessments = []
        for doc in results:
            assessments.append(AssessmentListItem(
                id=str(doc["_id"]),
                user_id=str(doc["user_id"]),
                user_email=doc.get("user", {}).get("email", "Unknown"),
                user_name=doc.get("user", {}).get("full_name", "Unknown"),
                depression_score=doc["depression_score"],
                anxiety_score=doc["anxiety_score"],
                stress_score=doc["stress_score"],
                depression_severity=doc["depression_severity"],
                anxiety_severity=doc["anxiety_severity"],
                stress_severity=doc["stress_severity"],
                created_at=doc["created_at"]
            ))
        
        return AssessmentListResponse(assessments=assessments, total=total)
