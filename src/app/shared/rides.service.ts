import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class RidesService {
  _calls = {
    numStravaApiCallsMade: 0,
    numStravaApiCallsDone: 0,
    numDbReadsMade: 0,
    numDbReadsDone: 0,
    numDbWritesMade: 0,
    numDbWritesDone: 0
  };

  calls: BehaviorSubject<any>;

  constructor(private firestore: AngularFirestore, private http: HttpClient) {
    this.calls = new BehaviorSubject(this._calls);
  }

  incrementCount(call: string) {
    this._calls[call] = ++this._calls[call];
    this.calls.next(this._calls);
  }

  addData(collection: string, key: string, data) {
    this.incrementCount("numDbWritesMade");
    return new Promise<any>((resolve, reject) => {
      this.firestore
        .collection(collection)
        .doc(key)
        .set(data)
        .then(
          res => {
            this.incrementCount("numDbWritesDone");
          },
          err => reject(err)
        );
    });
  }

  getByKeyFromDb(collection: string, key: string) {
    this.incrementCount("numDbReadsMade");
    return this.firestore
      .collection(collection)
      .doc(key.toString())
      .get()
      .toPromise();
  }

  startStravaStuff() {
    this.getStravaToken().then(token => {
      this.getStravaData(token.access_token, "activities", "&per_page=5").then(rides => {
        this.incrementCount("numStravaApiCallsDone");
        rides.forEach(ride => {
          if (ride.type === "Ride") {
            this.getByKeyFromDb("rides", ride.id).then(rideFromDb => {
              this.incrementCount("numDbReadsDone");
              if (rideFromDb.data() === undefined) {
                this.getStravaData(token.access_token, `activities/${ride.id}`, "").then(
                  rideDetails => {
                    this.incrementCount("numStravaApiCallsDone");
                    this.saveRideDetails(rideDetails);
                  }
                );
              }
            });
          }
        });
      });
    });
  }

  saveRideDetails(rideDetails) {
    this.addData("rides", rideDetails.id.toString(), this.convertApiRideToDbFormat(rideDetails));
  }

  convertApiSegEffortToDbFormat(segEffort, rideId: number) {
    return {
      average_cadence: segEffort.average_cadence,
      average_watts: segEffort.average_watts,
      device_watts: segEffort.device_watts,
      elapsed_time: segEffort.elapsed_time,
      id: segEffort.id,
      moving_time: segEffort.moving_time,
      ride_id: rideId,
      althlete_id: segEffort.athlete.id,
      segment_id: segEffort.segment_id,
      start_date: segEffort.start_date,
      start_date_local: segEffort.start_date_local,
      segment: {
        average_grade: segEffort.segment.average_grade,
        city: segEffort.segment.city,
        climb_category: segEffort.segment.climb_category,
        country: segEffort.segment.country,
        distance: segEffort.segment.distance,
        elevation_high: segEffort.segment.elevation_high,
        elevation_low: segEffort.segment.elevation_low,
        id: segEffort.segment.id,
        maximum_grade: segEffort.segment.maximum_grade,
        name: segEffort.segment.name,
        state: segEffort.segment.state
      }
    };
  }

  getSegEffortLastRidden(segEffort, segPerformance): string {
    if (segPerformance === undefined) return segEffort.start_date;
    return;
  }

  getSegEffortNumTimesRidden(segEffort, segPerformance): number {
    return;
  }

  getSegEffortRequiresRefresh(segEffort, segPerformance): boolean {
    return;
  }

  convertApiSegPerformanceToDbFormat(segEffort, segPerformance) {
    return {
      last_ridden_date: this.getSegEffortLastRidden(segEffort, segPerformance),
      num_times_ridden: this.getSegEffortNumTimesRidden(segEffort, segPerformance),
      requires_refresh: this.getSegEffortRequiresRefresh(segEffort, segPerformance),
      athlete_id: segEffort.athlete.id,
      segment_id: segEffort.segment.id,
      segment: {
        average_grade: segEffort.segment.average_grade,
        city: segEffort.segment.city,
        climb_category: segEffort.segment.climb_category,
        country: segEffort.segment.country,
        distance: segEffort.segment.distance,
        elevation_high: segEffort.segment.elevation_high,
        elevation_low: segEffort.segment.elevation_low,
        id: segEffort.segment.id,
        maximum_grade: segEffort.segment.maximum_grade,
        name: segEffort.segment.name,
        state: segEffort.segment.state
      }
    };
  }

  convertApiRideToDbFormat(rideDetails) {
    return {
      achievement_count: rideDetails.achievement_count,
      athlete_count: rideDetails.athlete_count,
      athlete_id: rideDetails.athlete.id,
      average_cadence: rideDetails.average_cadence,
      average_speed: rideDetails.average_speed,
      average_temp: rideDetails.average_temp,
      average_watts: rideDetails.average_watts,
      calories: rideDetails.calories,
      comment_count: rideDetails.comment_count,
      device_watts: rideDetails.device_watts,
      distance: rideDetails.distance,
      elapsed_time: rideDetails.elapsed_time,
      elev_high: rideDetails.elev_high,
      elev_low: rideDetails.elev_low,
      has_heartrate: rideDetails.has_heartrate,
      id: rideDetails.id,
      kudos_count: rideDetails.kudos_count,
      max_speed: rideDetails.max_speed,
      max_watts: rideDetails.max_watts,
      month: rideDetails.start_date.slice(5, 7),
      moving_time: rideDetails.moving_time,
      name: rideDetails.name,
      pr_count: rideDetails.pr_count,
      start_date: rideDetails.start_date,
      start_date_local: rideDetails.start_date_local,
      timezone: rideDetails.timezone,
      total_elevation_gain: rideDetails.total_elevation_gain,
      utc_offset: rideDetails.utc_offset,
      weighted_average_watts: rideDetails.weighted_average_watts,
      year: rideDetails.start_date.slice(0, 4)
    };
  }

  getStravaData(token: string, api: string, suffix: string): Promise<any> {
    const baseUrl = "https://www.strava.com/api/v3/";
    const fullUrl = `${baseUrl}${api}?access_token=${token}${suffix}`;
    this.incrementCount("numStravaApiCallsMade");
    return this.http.get(fullUrl).toPromise();
  }

  getStravaToken(): Promise<any> {
    const url = "https://www.strava.com/oauth/token";
    const data = {
      client_id: "39755",
      client_secret: "ab08660dcf7919ca0dac4111a8e1963aa9183c0d",
      code: "072cc35b6b4327aca112a1f9fb1f05709a167288",
      grant_type: "authorization_code"
    };
    return this.http.post(url, data).toPromise();
  }
}