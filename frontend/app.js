const API_BASE = window.location.origin;


// --------------------------------------------------
// Load operational logs
// --------------------------------------------------

async function loadLogs() {
    try {

        const res = await fetch(
            `${API_BASE}/api/v1/operations`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to load operations: HTTP ${res.status}`
            );
        }

        const data = await res.json();

        const tbody =
            document.getElementById("logTableBody");

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No operational submissions found.
                    </td>
                </tr>
            `;

            return;
        }

        data.forEach((item) => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.asset_name ?? "-"}</td>
                <td>${item.barrels_per_day ?? "-"}</td>
                <td>${item.pressure_psi ?? "-"}</td>
            `;

            tbody.appendChild(row);
        });

    } catch (err) {

        console.error(
            "Load logs error:",
            err
        );

        const tbody =
            document.getElementById("logTableBody");

        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="3">
                        Failed to load operational logs.
                    </td>
                </tr>
            `;
        }
    }
}


// --------------------------------------------------
// Production Log Submission
// --------------------------------------------------

document
    .getElementById("logForm")
    .addEventListener("submit", async (e) => {

        e.preventDefault();

        const payload = {
            asset_name:
                document.getElementById("assetName").value.trim(),

            barrels_per_day:
                parseInt(
                    document.getElementById("barrels").value,
                    10
                ),

            pressure_psi:
                parseInt(
                    document.getElementById("pressure").value,
                    10
                )
        };

        try {

            const res = await fetch(
                `${API_BASE}/api/v1/logs`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify(payload)
                }
            );

            // Read the response as text first.
            // This prevents a JSON parse error when the
            // backend returns HTML or another non-JSON response.
            const responseText = await res.text();

            let result = {};

            try {
                result = responseText
                    ? JSON.parse(responseText)
                    : {};
            } catch (parseError) {

                console.error(
                    "Backend returned non-JSON response:",
                    responseText
                );

                throw new Error(
                    `Server returned an invalid response (HTTP ${res.status})`
                );
            }

            if (!res.ok) {

                throw new Error(
                    result.error ||
                    result.message ||
                    result.detail ||
                    `HTTP ${res.status}`
                );
            }

            alert(
                "Operational metrics published successfully."
            );

            document
                .getElementById("logForm")
                .reset();

            await loadLogs();

        } catch (err) {

            console.error(
                "Production log submission error:",
                err
            );

            alert(
                `Submission failed: ${err.message}`
            );
        }
    });

// --------------------------------------------------
// Machine Learning Prediction
// --------------------------------------------------

document
    .getElementById("predictForm")
    .addEventListener("submit", async (e) => {

        e.preventDefault();

        const box =
            document.getElementById("predictionResult");

        try {

            // IMPORTANT:
            // These field names MUST match the ML API.
            const payload = {
                vibration_hz:
                    Number(
                        document.getElementById("vibration").value
                    ),

                temperature_celsius:
                    Number(
                        document.getElementById("temperature").value
                    )
            };

            // Show processing status
            if (box) {

                box.style.display = "block";

                box.style.backgroundColor =
                    "rgba(255, 102, 0, 0.15)";

                box.style.color =
                    "#FF9955";

                box.style.border =
                    "1px solid #FF6600";

                box.innerText =
                    "Running predictive analysis...";
            }

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

            if (!res.ok) {

                throw new Error(
                    result.error ||
                    result.message ||
                    JSON.stringify(result) ||
                    `Prediction failed: HTTP ${res.status}`
                );
            }

            if (!box) {
                return;
            }

            box.style.display = "block";

            // --------------------------------------------------
            // Critical condition
            // --------------------------------------------------

            if (result.downtime_imminent) {

                box.style.backgroundColor =
                    "rgba(255, 102, 0, 0.2)";

                box.style.color =
                    "#FF6600";

                box.style.border =
                    "1px solid #FF6600";

                box.innerText =
                    `CRITICAL WARNING: Maintenance Required! ` +
                    `Confidence: ` +
                    `${(result.failure_probability * 100).toFixed(1)}%` +
                    `\nRecommendation: ` +
                    `${result.recommendation}`;

            }

            // --------------------------------------------------
            // Stable condition
            // --------------------------------------------------

            else {

                box.style.backgroundColor =
                    "rgba(0, 106, 78, 0.2)";

                box.style.color =
                    "#00FF9D";

                box.style.border =
                    "1px solid #006A4E";

                box.innerText =
                    `System Stable. Failure Risk Factor: ` +
                    `${(result.failure_probability * 100).toFixed(1)}%` +
                    `\nRecommendation: ` +
                    `${result.recommendation}`;
            }

        } catch (err) {

            console.error(
                "ML prediction error:",
                err
            );

            if (box) {

                box.style.display = "block";

                box.style.backgroundColor =
                    "rgba(255, 0, 0, 0.15)";

                box.style.color =
                    "#FF6666";

                box.style.border =
                    "1px solid #FF6666";

                box.innerText =
                    `Prediction error: ${err.message}`;
            }
        }
    });


// --------------------------------------------------
// Initial page load
// --------------------------------------------------

window.addEventListener(
    "load",
    loadLogs
);
