from fastapi import FastAPI
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InferencePayload(BaseModel):

    vibration_hz: float
    temperature_celsius: float


@app.get("/api/ml/health")
def health():

    return {
        "status": "online",
        "engine": "scikit-predictive-matrix"
    }


@app.post("/api/ml/predict")
def run_prediction(
    payload: InferencePayload
):

    # Predictive analytics rules engine

    vibration_factor = (
        payload.vibration_hz / 60.0
    )

    temperature_factor = (
        payload.temperature_celsius / 100.0
    )


    failure_probability = min(
        1.0,
        max(
            0.0,
            (vibration_factor * 0.6)
            +
            (temperature_factor * 0.4)
        )
    )


    downtime_imminent = (
        failure_probability > 0.75
    )


    return {
        "failure_probability":
            float(failure_probability),

        "downtime_imminent":
            bool(downtime_imminent),

        "recommendation":
            (
                "Emergency Flush Protocol Required"
                if downtime_imminent
                else
                "System Normative Stable Static"
            )
    }


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )
