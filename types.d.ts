type GameEvent = {
    "name": string,
    "start_time": {
        "year": number,
        "month": number,
        "day": number,
        "hour": number,
        "minute": number
    }?,
    "end_time": {
        "year": number,
        "month": number,
        "day": number,
        "hour": number,
        "minute": number
    }?,
    "detail": string
}