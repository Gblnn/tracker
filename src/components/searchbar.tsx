import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import SearchBar from "./search-bar";
import { ArrowDown01, ArrowDownAZ, ListStart } from "lucide-react";

interface Props {
  onChange?: any;
}

export default function SearchBox(props: Props) {
  const [sortby, setSortBy] = useState("");

  return (
    <>
      <div
        className="transitions"
        style={{
          display: "flex",
          gap: "0.35rem",
          padding: "",

          borderRadius: "0.85rem",
          flex: 1,
        }}
      >
        {/* {access && (
                    <button
                      className={selectable ? "blue" : ""}
                      onClick={() => {
                        setSelectable(!selectable);
                        selectable && setChecked([]);
                        !selectable && setSelected(false);
                      }}
                    >
                      <CheckSquare2
                        color={selectable ? "white" : "dodgerblue"}
                      />
                    </button>
                  )} */}

        <SearchBar placeholder="Search" onChange={props.onChange} />

        <Select defaultValue="name" onValueChange={setSortBy}>
          <SelectTrigger style={{ width: "fit-content", background: "" }}>
            {sortby == "name" ? (
              <ArrowDownAZ width={"1.25rem"} color="dodgerblue" />
            ) : sortby == "created_on" ? (
              <ListStart width={"1.25rem"} color="dodgerblue" />
            ) : (
              <ArrowDown01 width={"1.25rem"} color="dodgerblue" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem style={{ justifyContent: "flex-start" }} value="name">
              Name
            </SelectItem>
            {/* <SelectItem
                        style={{ justifyContent: "flex-start" }}
                        value="employeeCode"
                      >
                        Code
                      </SelectItem> */}
            <SelectItem
              style={{ justifyContent: "flex-start" }}
              value="created_on"
            >
              Original
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
