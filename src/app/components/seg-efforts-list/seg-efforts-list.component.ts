import { Component, OnInit } from "@angular/core";
import { SegmentPerformances, SegmentEffort } from "src/app/model/segment";
import { RidesService } from "src/app/shared/rides.service";
import { FilterUtils } from "primeng/api";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-seg-efforts-list",
  templateUrl: "./seg-efforts-list.component.html",
  styleUrls: ["./seg-efforts-list.component.scss"]
})
export class SegEffortsListComponent implements OnInit {
  segPerfs: SegmentPerformances;
  segEfforts: SegmentEffort[];
  rideId: number;
  cols: any[];
  selectedColumns: any[];

  constructor(private ridesService: RidesService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.rideId = Number(this.route.snapshot.paramMap.get("id"));
    this.ridesService.getSegPerformances().then((segPerfs: SegmentPerformances) => {
      this.segPerfs = segPerfs;

      this.ridesService.getRideSegments(this.rideId).then(segEfforts => {
        this.segEfforts = this.segPerfs.getSegmentEffortWithPerformance(segEfforts);

        this.cols = [
          { field: "segment_name_with_link", header: "Name" },
          { field: "segment_city", header: "City" },
          { field: "num_times_ridden", header: "Times Ridden" },
          { field: "rank", header: "Rank" },
          { field: "segment_average_grade", header: "Avg Grade" },
          { field: "people_above", header: "People Above" },
          { field: "people_below", header: "People Below" },
          { field: "pr_date", header: "PR Date" },
          { field: "pr_elapsed_time", header: "PR Time (s)" },
          { field: "top_date", header: "Top Date" },
          { field: "top_elapsed_time", header: "Top Time (s)" },
          { field: "average_cadence", header: "Avg Cadence" },
          { field: "average_watts", header: "Avg Watts" },
          { field: "moving_time", header: "Moving Time" },
          { field: "startTime", header: "Start Date" }
        ];
        this.selectedColumns = this.cols;
        FilterUtils["greaterThan"] = (value, filter): boolean => {
          if (filter === undefined || filter === null || filter.trim() === "") return true;
          if (value === undefined || value === null) return false;
          return parseInt(filter) < value;
        };
      });
    });
  }
}
