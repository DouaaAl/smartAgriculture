"use client";

import { useEffect, useState } from "react";

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch alerts from your Vercel database or internal API route
  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts"); // Ensure you have a corresponding GET endpoint matching your setup
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Error loading field alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll the endpoint every 5 seconds to match the rover's upload velocity
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
            AgroRover Real-Time Health Monitor
          </h1>
          <p className="text-sm text-slate-400">
            Live crop diagnostics and automated microclimate telemetry sync
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          System Live (5s polling)
        </div>
      </header>

      {loading && alerts.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-slate-400">
          Syncing dashboard tracking systems...
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border border-dashed border-slate-800 rounded-xl p-6 text-center">
          <span className="text-4xl mb-2">🌱</span>
          <h3 className="text-lg font-semibold text-slate-300">No active anomalies found</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            The canopy matrix is verified clean. Healthy baseline fields maintained by local filter layers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col md:flex-row transition-all hover:border-slate-700"
            >
              {/* Image Preview Window */}
              <div className="relative w-full md:w-48 h-48 md:h-auto bg-slate-900 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-800">
                {alert.imageSrc ? (
                  <img
                    src={alert.imageSrc}
                    alt={alert.condition}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                    No image frame payload
                  </div>
                )
                }
              </div>

              {/* Information Framework Container */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h2 className="text-lg font-bold text-rose-400 tracking-wide">
                      {alert.condition}
                    </h2>
                    <span className="bg-rose-950/50 text-rose-400 text-[10px] font-medium px-2 py-0.5 rounded border border-rose-900/40 uppercase whitespace-nowrap">
                      {alert.severity || "Anomaly Registered"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-4">
                    Logged at: {alert.timestamp || "Unknown interval timestamp"}
                  </p>

                  {/* Synchronized Cloud Telemetry Metrics */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60 mb-4 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Moisture</div>
                      <div className="text-sm font-semibold text-sky-400 mt-0.5">
                        {alert.sensors?.soilMoisture}%
                      </div>
                    </div>
                    <div className="border-x border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Temp</div>
                      <div className="text-sm font-semibold text-amber-400 mt-0.5">
                        {alert.sensors?.temperature}°C
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Humidity</div>
                      <div className="text-sm font-semibold text-indigo-400 mt-0.5">
                        {alert.sensors?.humidity}%
                      </div>
                    </div>
                  </div>

                  {/* Actionable Solution Mapping */}
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                      Automated Field Remediation Solutions:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {alert.solutions && alert.solutions.length > 0 ? (
                        alert.solutions.map((sol, index) => (
                          <li key={index} className="flex items-start gap-2 leading-relaxed">
                            <span className="text-emerald-500 select-none mt-0.5">▪</span>
                            <span>{sol}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500 italic">No microclimate alerts triggered for this node layer.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}