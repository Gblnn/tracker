import Back from "@/components/back";
import BottomNav from "@/components/bottom-nav";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import {
    PhonebookRecord,
    getPhonebookData,
    getPhonebookFromCache,
    isCacheStale
} from "@/utils/phonebookCache";
import { motion } from "framer-motion";
import { AtSign, Building2, PhoneIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Phonebook() {
    const [records, setRecords] = useState<PhonebookRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<PhonebookRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredRecords = records.filter(record => {
        const displayName = record.display_name || record.name;
        const query = searchQuery.toLowerCase();
        const queryForNumbers = searchQuery.trim();
        
        return displayName.toLowerCase().includes(query) ||
            record.name.toLowerCase().includes(query) ||
            record.email.toLowerCase().includes(query) ||
            (record.contact && String(record.contact).startsWith(queryForNumbers)) ||
            (record.cug && String(record.cug).startsWith(queryForNumbers)) ||
            record.designation?.toLowerCase().includes(query);
    }).sort((a, b) => {
        const cugA = a.cug || Number.MAX_SAFE_INTEGER;
        const cugB = b.cug || Number.MAX_SAFE_INTEGER;
        return cugA - cugB;
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const fetchedRecords = await getPhonebookData(true); // Force refresh
            setRecords(fetchedRecords);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching records:", error);
            setLoading(false);
        }
    }

    const getInitials = (name: string) => {
    return name[0]?.toUpperCase() || "?";
  };

    useEffect(() => {
        // Load from cache immediately for fast initial display
        const cachedData = getPhonebookFromCache();
        if (cachedData) {
            setRecords(cachedData);
        }

        // Fetch fresh data if cache is stale or doesn't exist
        const loadData = async () => {
            if (!cachedData || isCacheStale()) {
                try {
                    setLoading(true);
                    const freshData = await getPhonebookData();
                    setRecords(freshData);
                } catch (error) {
                    console.error("Error fetching records:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadData();
    }, []);

    return(
        <>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <div style={{padding: "", position:"fixed", zIndex: 20}}>
            <Back
            noback
            blurBG
            subtitle={records.length}
            fixed
        extra={
            <>
            <RefreshButton onClick={fetchData} fetchingData={loading}/>
            </>
        }
        //    icon={<Notebook color="mediumslateblue"/>} 
           title={"Phonebook"}/>
        </div>
        
        <div style={{
            position: "fixed",
            top: "4.5rem",
            left: 0,
            right: 0,
            padding: "0.75rem 1.25rem",
            background: "rgba(250, 250, 250)",
            zIndex: 15,
            borderBottom: "1px solid rgba(100, 100, 100, 0.1)"
        }}>
            <div style={{
                position: "relative",
                width: "100%",
            }}>
                <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        background: "rgba(150, 150, 150, 0.15)",
                        fontSize: "1rem",
                    }}
                />
            </div>
        </div>



        <div style={{ 
            border:"",
            paddingTop:"10rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "8rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            zIndex: "",
        }}>

            {filteredRecords.map((record) => {
                const displayName = record.display_name || record.name;
                return (
                <Directive
                subtext={record.designation?.toLowerCase()}
                    onClick={() => {
                        setSelectedRecord(record);
                        setDrawerOpen(true);
                    }}
                    icon={<Avatar  className="h-10 w-10">
                                    <AvatarFallback style={{fontWeight:"600", background:"rgba(100 100 100/ 0.1)", fontSize:"1rem", color:""}} className="text-lg">
                                      {displayName
                                        ? getInitials(displayName.split("@")[0])
                                        : "?"}
                                    </AvatarFallback>
                                  </Avatar>}
                    key={record.id}
                    title={displayName}
                    
                />
            );})}
        </div>
        </motion.div>

        <Drawer 
            open={drawerOpen} 
            onOpenChange={setDrawerOpen}
        >
            <DrawerTitle></DrawerTitle>
            <DrawerDescription></DrawerDescription>
            <DrawerContent className="pb-safe">
                <div style={{ 
                    paddingTop:0,
                    padding: "1.25rem", 
                    width:"100%",
                    paddingBottom: "4rem",
                
                }}>
                    <div style={{display:"flex", justifyContent:"center"}}>
                        <Avatar  className="h-20 w-20">
                                    <AvatarFallback style={{fontWeight:"600", background:"rgba(100 100 100/ 0.1)", fontSize:"2.5rem", }} className="text-lg">
                                      {selectedRecord
                                        ? getInitials((selectedRecord.display_name || selectedRecord.name).split("@")[0])
                                        : "?"}
                                    </AvatarFallback>
                                  </Avatar>
                    </div>
                    <br/>
                    <div style={{display:"flex", justifyContent:"center", alignItems:"center", padding:"1.25rem", paddingTop:"0", flexFlow:"column", gap:""}}>
                        <h2 style={{fontSize:"1.5rem", textTransform: "capitalize", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%"}}>{(selectedRecord?.display_name || selectedRecord?.name || "").toLowerCase()}</h2>
                        <p style={{fontSize:"0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", textTransform: "uppercase"}}>{selectedRecord?.designation?.toLowerCase()}</p>
                    </div>
                    
                    <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "0.75rem",
                        marginTop: "",
                        width: "100%"
                    }}>

                        <Directive onClick={() => { selectedRecord?.email && (location.href = "mailto:" + selectedRecord?.email); }} icon={<AtSign width={"1.25rem"} color="mediumslateblue"/>} notName title={selectedRecord?.email||"No Email"} />
                        <div style={{display:"flex", gap:"0.75rem", width: "100%"}}>
                            <Directive notName onClick={() => { selectedRecord?.contact && (location.href = "tel:" + selectedRecord?.contact); }} title={selectedRecord?.contact||"No Contact"} icon={<PhoneIcon width={"1.25rem"} color="mediumslateblue"/>}/>
                            {
                                selectedRecord?.cug &&
                                <Directive notName onClick={() => { selectedRecord?.cug && (location.href = "tel:" + selectedRecord?.cug); }} title={selectedRecord?.cug||"No CUG"} icon={<Building2 width={"1.25rem"} color="mediumslateblue"/>}/>
                            }
                            
                        </div>
                        
                        
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
        <BottomNav />
        </>
    )
}