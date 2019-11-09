import { Component, OnInit } from "@angular/core";
import { RidesService } from "src/app/shared/rides.service";
import { FilterUtils } from "primeng/api";
import { SegmentPerformances } from "src/app/model/segment";

@Component({
  selector: "app-seg-perf-list",
  templateUrl: "./seg-perf-list.component.html",
  styleUrls: ["./seg-perf-list.component.scss"]
})
export class SegPerfListComponent implements OnInit {
  segPerfs: SegmentPerformances;
  cols: any[];
  selectedColumns: any[];

  constructor(private ridesService: RidesService) {
    this.ridesService.getSegPerformances().then((segPerfs: SegmentPerformances) => {
      this.segPerfs = segPerfs;
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
        { field: "top_elapsed_time", header: "Top Time (s)" }
      ];
      this.selectedColumns = this.cols;
      FilterUtils["greaterThan"] = (value, filter): boolean => {
        if (filter === undefined || filter === null || filter.trim() === "") return true;
        if (value === undefined || value === null) return false;
        return parseInt(filter) < value;
      };
    });
  }

  ngOnInit() {}
}
