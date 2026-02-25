import Back from "@/components/back";
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
import { AtSign, Building2, Notebook, PhoneIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Phonebook() {
    const [records, setRecords] = useState<PhonebookRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<PhonebookRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredRecords = records.filter(record => 
        record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // record.contact?.includes(searchQuery) ||
        record.designation?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            blurBG
            subtitle={records.length}
            fixed
        extra={
            <>
            <RefreshButton onClick={fetchData} fetchingData={loading}/>
            </>
        }
           icon={<Notebook color="dodgerblue"/>} title={"Phonebook"}/>
        </div>
        



        <div style={{ 
            border:"",
            paddingTop:"5.25rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            zIndex: "",
            marginBottom: "env(safe-area-inset-bottom, 0px)"
        }}>

            {filteredRecords.map((record) => (
                <Directive
                subtext={record.designation}
                    onClick={() => {
                        setSelectedRecord(record);
                        setDrawerOpen(true);
                    }}
                    icon={<Avatar  className="h-10 w-10">
                                    <AvatarFallback style={{fontWeight:"600", background:"rgba(100 100 100/ 0.1)", fontSize:"1rem", color:""}} className="text-lg">
                                      {record.name
                                        ? getInitials(record.name.split("@")[0])
                                        : "?"}
                                    </AvatarFallback>
                                  </Avatar>}
                    key={record.id}
                    title={record.name}
                    
                />
            ))}
        </div>

        <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "1rem 1.25rem",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 1rem))",
            WebkitBackdropFilter: "blur(16px)",
            backdropFilter: "blur(16px)",
            background: "rgba(100, 100, 100, 0.05)",
            zIndex: 10,
            borderTop: "1px solid rgba(100, 100, 100, 0.1)"
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
        </motion.div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
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
                                      {selectedRecord?.name
                                        ? getInitials(selectedRecord.name.split("@")[0])
                                        : "?"}
                                    </AvatarFallback>
                                  </Avatar>
                    </div>
                    <br/>
                    <div style={{display:"flex", justifyContent:"center", alignItems:"center", padding:"1.25rem", paddingTop:"0", flexFlow:"column", gap:""}}>
                        <h2 style={{fontSize:"1.5rem"}}>{selectedRecord?.name}</h2>
                        <p style={{fontSize:"0.8rem"}}>{selectedRecord?.designation}</p>
                    </div>
                    
                    <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "0.75rem",
                        marginTop: "",
                        width: "100%"
                    }}>

                        <Directive onClick={() => { selectedRecord?.email && (location.href = "mailto:" + selectedRecord?.email); }} icon={<AtSign width={"1.25rem"} color="dodgerblue"/>} notName title={selectedRecord?.email||"No Email"} />
                        <div style={{display:"flex", gap:"0.75rem"}}>
                            <Directive onClick={() => { selectedRecord?.contact && (location.href = "tel:" + selectedRecord?.contact); }} title={selectedRecord?.contact||"No Contact"} icon={<PhoneIcon width={"1.25rem"} color="dodgerblue"/>}/>
                            {
                                selectedRecord?.cug &&
                                <Directive onClick={() => { selectedRecord?.cug && (location.href = "tel:" + selectedRecord?.cug); }} title={selectedRecord?.cug||"No CUG"} icon={<Building2 width={"1.25rem"} color="dodgerblue"/>}/>
                            }
                            
                        </div>
                        
                        
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
        </>
    )
}