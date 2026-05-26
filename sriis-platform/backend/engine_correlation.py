import math

async def infer_cascading_failures(recent_anomalies):
    """
    Analyzes temporal patterns in recent anomalies to infer dependencies and root causes.
    Returns a dictionary containing the root_dependency and cascading_chains.
    """
    if not recent_anomalies:
        return {"root_dependency": "unknown", "cascading_chain": [], "correlation_confidence": 0.0}

    # Group anomalies by service and find the earliest timestamp and count
    service_stats = {}
    for a in recent_anomalies:
        svc = a.get("service")
        if svc not in service_stats:
            service_stats[svc] = {"earliest": a["ingested_at"], "error_count": 0, "latency_count": 0}
            
        service_stats[svc]["error_count"] += 1
        if "latency" in a.get("message", "").lower() or "timeout" in a.get("message", "").lower():
            service_stats[svc]["latency_count"] += 1
            
        if a["ingested_at"] < service_stats[svc]["earliest"]:
            service_stats[svc]["earliest"] = a["ingested_at"]
            
    if len(service_stats) == 1:
        # Single service failure
        svc = list(service_stats.keys())[0]
        return {"root_dependency": svc, "cascading_chain": [], "correlation_confidence": 1.0}

    # Sort services by earliest anomaly time to infer causality
    sorted_services = sorted(service_stats.keys(), key=lambda s: service_stats[s]["earliest"])
    root_dependency = sorted_services[0]
    
    cascading_chain = []
    overall_confidence = 0.0
    
    for i in range(len(sorted_services) - 1):
        source = sorted_services[i]
        target = sorted_services[i+1]
        
        # Calculate time proximity score (0 to 1) - closer is higher
        time_diff = (service_stats[target]["earliest"] - service_stats[source]["earliest"]).total_seconds()
        # If target started failing within 10 seconds of source, high score
        time_proximity = max(0, 1.0 - (time_diff / 10.0)) if time_diff >= 0 else 0
        
        # Calculate overlap scores
        src_errs = service_stats[source]["error_count"]
        tgt_errs = service_stats[target]["error_count"]
        error_overlap = min(src_errs, tgt_errs) / max(src_errs, tgt_errs, 1)
        
        src_lat = service_stats[source]["latency_count"]
        tgt_lat = service_stats[target]["latency_count"]
        latency_overlap = min(src_lat, tgt_lat) / max(src_lat, tgt_lat, 1) if max(src_lat, tgt_lat) > 0 else 0
        
        # The recommended formula
        correlation_score = (time_proximity * 0.4) + (error_overlap * 0.3) + (latency_overlap * 0.3)
        
        cascading_chain.append({
            "source": source,
            "target": target,
            "confidence": round(correlation_score, 2)
        })
        overall_confidence += correlation_score
        
    overall_confidence = overall_confidence / len(cascading_chain) if cascading_chain else 1.0
    
    return {
        "root_dependency": root_dependency,
        "cascading_chain": cascading_chain,
        "correlation_confidence": round(overall_confidence, 2)
    }
