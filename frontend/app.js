const API_BASE = window.location.origin;


// Load operational logs
async function loadLogs() {
    try {
        const res = await fetch(
            `${API_BASE}/api/v1/logs`
        );

        const data = await res.json();

        const tbody =
            document.getElementById("logTableBody");

        tbody.innerHTML = "";

        data.forEach(log => {

            tbody.innerHTML += `
                <tr>
                    <td>${log.asset_name}</td>
                    <td>${log.barrels_per_day} bbl</td>
                    <td>${log.pressure_psi} PSI</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(
            "Error loading log entries:",
            err
        );
    }
}


// Production Log Submission
document
    .getElementById("logForm")
    .addEventListener("submit", async (e) => {

        e.preventDefault();

        const payload = {
            asset_name:
                document.getElementById("assetName").value,

            barrels_per_day:
                parseInt(
                    document.getElementById("barrels").value
                ),

            pressure_psi:
                parseInt(
                    document.getElementById("pressure").value
                )
        };

        try {

            await fetch(
                `${API_BASE}/api/v1/logs`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload)
                }
            );

            await loadLogs();

        } catch (err) {

            console.error(
                "Error submitting operational data:",
                err
            );
        }
    });


// ML Prediction
document
    .getElementById("predictForm")
    .addEventListener("submit", async (e) => {

        e.preventDefault();

        const payload = {
            vibration_hz:
                parseFloat(
                    document.getElementById("vibration").value
                ),

            temperature_celsius:
                parseFloat(
                    document.getElementById("temperature").value
                )
        };

        try {

            const res = await fetch(
                `${API_BASE}/api/ml/predict`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload)
                }
            );

            const result = await res.json();

            const box =
                document.getElementById(
                    "predictionResult"
                );

            box.style.display = "block";

            if (result.downtime_imminent) {

                box.style.backgroundColor =
                    "rgba(255, 102, 0, 0.2)";

                box.style.color = "#FF6600";

                box.style.border =
                    "1px solid #FF6600";

                box.innerText =
                    `CRITICAL WARNING: Maintenance Required! ` +
                    `Confidence: ${(result.failure_probability * 100).toFixed(1)}%`;

            } else {

                box.style.backgroundColor =
                    "rgba(0, 106, 78, 0.2)";

                box.style.color = "#00FF9D";

                box.style.border =
                    "1px solid #006A4E";

                box.innerText =
                    `System Stable. Failure Risk Factor: ` +
                    `${(result.failure_probability * 100).toFixed(1)}%`;
            }

        } catch (err) {

            console.error(
                "ML prediction error:",
                err
            );
        }
    });


window.onload = loadLogs;
