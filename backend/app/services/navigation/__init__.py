"""教育トピックのナビゲーション（トピックネットワークと次トピックの推薦）。"""

from app.services.navigation.recommender import NavState, rank
from app.services.navigation.topic_graph import content_ids, load_topic_graph

__all__ = ["NavState", "content_ids", "load_topic_graph", "rank"]
