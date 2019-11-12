import { Injectable } from "@angular/core";
import { DatabaseService } from "./database.service";
import { SegmentPerformances, SegmentEffort } from "../model/segment";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { ISegEffort, ISegPerformance } from "../model/model";
import { CollectionReference, AngularFirestore } from "@angular/fire/firestore";
import { Observable, BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class SegmentService {
  private segPerfs: SegmentPerformances = null;
  incrementCount: BehaviorSubject<any>;
  propagateMsg: BehaviorSubject<any>;

  constructor(
    private remoteDbService: DatabaseService,
    private localDbService: NgxIndexedDBService,
    private firestore: AngularFirestore
  ) {
    this.incrementCount = new BehaviorSubject(null);
    this.propagateMsg = new BehaviorSubject(null);
  }

  clearLocalDb() {
    this.segPerfs = null;
  }

  getRideSegments(rideId: number): Promise<SegmentEffort[]> {
    return this.getSegPerformances().then((segPerfs: SegmentPerformances) => {
      return this.localDbService.getByIndex("key", rideId).then(seFromLocalDb => {
        if (seFromLocalDb === undefined)
          return this.getRideSegmentsFromDb(rideId).then((seFromDb: ISegEffort[]) =>
            segPerfs.getSegmentEffortWithPerformance(seFromDb)
          );
        else
          return segPerfs.getSegmentEffortWithPerformance(
            JSON.parse(seFromLocalDb.value).seg_efforts
          );
      });
    });
  }

  private getRideSegmentsFromDb(rideId: number): Promise<ISegEffort[]> {
    return this.remoteDbService.getByKey("ride_seg_efforts", rideId).then(segEfforts => {
      this.localDbService.add({ key: rideId, value: JSON.stringify(segEfforts) });
      return segEfforts.seg_efforts;
    });
  }

  getSegPerformances(): Promise<SegmentPerformances> {
    if (this.segPerfs !== null) return new Promise(resolve => resolve(this.segPerfs));
    return this.localDbService
      .getByIndex(this.remoteDbService.localDb.key, this.remoteDbService.localDb.segPerfs)
      .then(segPerfs => {
        if (segPerfs === undefined) return this.getSegPerformancesFromDb();
        else {
          const segPerfsToReturn: SegmentPerformances = new SegmentPerformances(
            JSON.parse(segPerfs.value)._segmentPerformances,
            null
          );
          this.segPerfs = segPerfsToReturn;
          return segPerfsToReturn;
        }
      });
  }

  private getSegPerformancesFromDb(): Promise<SegmentPerformances> {
    return this.firestore
      .collection(this.remoteDbService.collections.segmentPerformance, (ref: CollectionReference) =>
        ref
          .where("num_entries", ">", 1)
          .orderBy("num_entries", "desc")
          .orderBy("num_times_ridden", "desc")
          .limit(10000)
      )
      .get()
      .toPromise()
      .then(res => {
        const segPerfsNumEntries = res.docs.map(segPerf => segPerf.data() as ISegPerformance);
        return this.getSegPerformancesRiddenMostFromDb(segPerfsNumEntries);
      });
  }

  private getSegPerformancesRiddenMostFromDb(
    segPerfsNumEntries: ISegPerformance[]
  ): Promise<SegmentPerformances> {
    return this.firestore
      .collection(this.remoteDbService.collections.segmentPerformance, (ref: CollectionReference) =>
        ref
          .where("num_times_ridden", ">", 1)
          .orderBy("num_times_ridden", "desc")
          .limit(10000)
      )
      .get()
      .toPromise()
      .then(res => {
        const segPerfs = new SegmentPerformances(
          segPerfsNumEntries,
          res.docs.map(segPerf => segPerf.data() as ISegPerformance)
        );
        this.localDbService.add({
          key: this.remoteDbService.localDb.segPerfs,
          value: JSON.stringify(segPerfs)
        });
        this.segPerfs = segPerfs;
        return segPerfs;
      });
  }

  getPerformanceDataToRefresh(): Observable<any> {
    this.incrementCount.next("numDbReadsMade");
    return this.firestore
      .collection("segment_performance", (ref: CollectionReference) =>
        ref.where("requires_refresh", "==", true).limit(10)
      )
      .valueChanges();
  }
}