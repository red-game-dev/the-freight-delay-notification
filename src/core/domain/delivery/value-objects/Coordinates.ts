/**
 * Coordinates Value Object
 * Represents geographic coordinates with validation
 */

import { DomainError } from "../../../base/errors/BaseError";

interface CoordinatesProps {
  lat: number;
  lng: number;
}

export class Coordinates {
  private constructor(private readonly props: CoordinatesProps) {}

  /**
   * Create coordinates with validation
   * @throws DomainError if coordinates are invalid
   */
  static create(props: CoordinatesProps): Coordinates {
    // Validate latitude
    if (props.lat < -90 || props.lat > 90) {
      throw new DomainError("Invalid latitude: must be between -90 and 90", {
        latitude: props.lat,
      });
    }

    // Validate longitude
    if (props.lng < -180 || props.lng > 180) {
      throw new DomainError("Invalid longitude: must be between -180 and 180", {
        longitude: props.lng,
      });
    }

    return new Coordinates(props);
  }

  get lat(): number {
    return this.props.lat;
  }

  get lng(): number {
    return this.props.lng;
  }

  get latitude(): number {
    return this.props.lat;
  }

  get longitude(): number {
    return this.props.lng;
  }

  /**
   * Check equality with another Coordinates object
   */
  public equals(other: Coordinates): boolean {
    return (
      this.props.lat === other.props.lat && this.props.lng === other.props.lng
    );
  }

  /**
   * Convert to PostgreSQL POINT format: POINT(lng lat)
   */
  public toPoint(): string {
    return `POINT(${this.props.lng} ${this.props.lat})`;
  }

  /**
   * Convert to plain object for database/API use
   */
  public toJSON(): CoordinatesProps {
    return {
      lat: this.props.lat,
      lng: this.props.lng,
    };
  }

  /**
   * Create from database POINT format
   */
  static fromPoint(point: string): Coordinates {
    // POINT format: "(lng,lat)" or "POINT(lng lat)"
    const cleaned = point.replace(/POINT\(|\(|\)/gi, "");
    const parts = cleaned.split(/[,\s]+/).map(Number);

    if (parts.length !== 2 || parts.some(isNaN)) {
      throw new DomainError("Invalid POINT format", { point });
    }

    return Coordinates.create({ lng: parts[0], lat: parts[1] });
  }
}
