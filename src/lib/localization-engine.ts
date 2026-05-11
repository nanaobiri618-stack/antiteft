/**
 * Professional-grade Hybrid Localization Engine (TypeScript/Web Version).
 * Implements the Log-Distance Path Loss Model and WNLS (Weighted Nonlinear Least Squares) 
 * using Gradient Descent to pinpoint a device from multiple scanner reports.
 */

export interface SensorData {
  lat: number;
  lng: number;
  rssi: number;
}

export interface LocationResult {
  lat: number;
  lng: number;
  confidence: number;
  radii: number[];
}

export class LocalizationEngine {
  private txPower: number;
  private n: number; // Path loss exponent (environmental factor)

  constructor(txPower: number = -59, n: number = 2.5) {
    this.txPower = txPower;
    this.n = n;
  }

  /**
   * Converts RSSI to distance in meters.
   */
  rssiToMeters(rssi: number): number {
    return Math.pow(10, (this.txPower - rssi) / (10 * this.n));
  }

  /**
   * Trilaterates the precise location from multiple sensors.
   * Uses Gradient Descent to minimize the residual error sum of squares.
   */
  findPreciseLocation(sensors: SensorData[]): LocationResult | null {
    if (sensors.length === 0) return null;

    const distances = sensors.map(s => this.rssiToMeters(s.rssi));

    if (sensors.length === 1) {
      return {
        lat: sensors[0].lat,
        lng: sensors[0].lng,
        confidence: 0.1,
        radii: distances
      };
    }

    // 1. Initial Guess (Centroid)
    let currentLat = sensors.reduce((acc, s) => acc + s.lat, 0) / sensors.length;
    let currentLng = sensors.reduce((acc, s) => acc + s.lng, 0) / sensors.length;

    // Local Cartesian projection (accurate for distances < 10km)
    const latToMeters = 111320.0;
    const lngToMeters = 111320.0 * Math.cos(currentLat * Math.PI / 180);

    const x = sensors.map(s => (s.lng - currentLng) * lngToMeters);
    const y = sensors.map(s => (s.lat - currentLat) * latToMeters);
    const r = distances;

    let estX = 0;
    let estY = 0;
    const learningRate = 0.01;
    const epochs = 1000;

    // 2. Iterative Optimization (Gradient Descent)
    for (let i = 0; i < epochs; i++) {
      let gradX = 0;
      let gradY = 0;

      for (let j = 0; j < sensors.length; j++) {
        const dx = estX - x[j];
        const dy = estY - y[j];
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.0001) dist = 0.0001;

        const error = dist - r[j];
        gradX += 2 * error * (dx / dist);
        gradY += 2 * error * (dy / dist);
      }

      estX -= learningRate * gradX;
      estY -= learningRate * gradY;
    }

    // 3. Convert back to Geocoordinates
    const finalLat = currentLat + (estY / latToMeters);
    const finalLng = currentLng + (estX / lngToMeters);

    // 4. Calculate Confidence
    let totalError = 0;
    for (let j = 0; j < sensors.length; j++) {
      const dx = estX - x[j];
      const dy = estY - y[j];
      const dist = Math.sqrt(dx * dx + dy * dy);
      totalError += Math.abs(dist - r[j]);
    }
    const confidence = 1.0 / (1.0 + (totalError / sensors.length));

    return {
      lat: finalLat,
      lng: finalLng,
      confidence,
      radii: distances
    };
  }
}

/**
 * 1D Kalman Filter for smoothing RSSI inputs on the web dashboard.
 */
export class RssiKalmanFilter {
  private r: number; // Process noise
  private q: number; // Measurement noise
  private x: number | null = null;
  private cov: number = 1.0;

  constructor(r: number = 0.008, q: number = 0.1) {
    this.r = r;
    this.q = q;
  }

  filter(measurement: number): number {
    if (this.x === null) {
      this.x = measurement;
      this.cov = 1.0;
    } else {
      const predX = this.x;
      const predCov = this.cov + this.r;

      const k = predCov / (predCov + this.q);
      this.x = predX + k * (measurement - predX);
      this.cov = (1 - k) * predCov;
    }
    return this.x;
  }
}
