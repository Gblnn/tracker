import Back from "@/components/back";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { db } from "@/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { AtSign, Building2, Notebook, PhoneIcon, Search, User2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Record {
    id: string;
    name: string;
    email: string;
    contact?: string;
    cug?: number;
    role?: string;
}

export default function Phonebook() {
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredRecords = records.filter(record => 
        record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // record.contact?.includes(searchQuery) ||
        record.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchData = async () => {
        try {
            setLoading(true);
            const recordsRef = collection(db, "records");
            const q = query(recordsRef, orderBy("name", "asc"), where("contact", "!=", ""));
            const querySnapshot = await getDocs(q);
            
            const fetchedRecords: Record[] = [];
            querySnapshot.forEach((doc) => {
                fetchedRecords.push({
                    id: doc.id,
                    ...doc.data() as Omit<Record, "id">
                });
            });
            
            setRecords(fetchedRecords);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching records:", error);
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    return(
        <>
        <div style={{padding: "", position:"fixed"}}>
            <Back
            subtitle={records.length}
            fixed
        extra={
            <>
            <RefreshButton onClick={fetchData} fetchingData={loading}/>
            </>
        }
          blurBG icon={<Notebook color="dodgerblue"/>} title={"Phonebook"}/>
        </div>
        

        <div style={{
            position: "fixed",
            top: "4rem",
            left: 0,
            right: 0,
            padding: "1rem 1.25rem",
            backdropFilter: "blur(8px)",
            background: "none",
            zIndex: 10,
            marginTop: ""
        }}>
            <div style={{
                position: "relative",
                width: "100%",
            }}>
                <Search 
                    width="0.9rem" 
                    style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "gray"
                    }}
                />
                <input
                    type="text"
                    placeholder="Search by name, email, phone or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingLeft: "2.25rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(100, 100, 100, 0.2)",
                        background: "rgba(100, 100, 100, 0.15)",
                        fontSize: "1rem",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}
                />
            </div>
        </div>

        <div style={{ 
            border:"",
            paddingTop: "",
            marginTop: "",
            padding: "1.25rem",
            paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 2rem))", // Add safe area padding
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            zIndex: "",
            marginBottom: "env(safe-area-inset-bottom, 0px)" // Add safe area margin
        }}>
            <div style={{border:"", height:"7rem"}}></div>

            {filteredRecords.map((record) => (
                <Directive
                subtext={record.role}
                    onClick={() => {
                        setSelectedRecord(record);
                        setDrawerOpen(true);
                    }}
                    icon={<User2 width="1.25rem" color="dodgerblue"/>}
                    key={record.id}
                    title={record.name}
                    
                />
            ))}
        </div>

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
                    <div style={{display:"flex", justifyContent:"center", alignItems:"center", padding:"1.25rem", paddingTop:"0", flexFlow:"column", gap:""}}>
                        <h2>{selectedRecord?.name}</h2>
                        <p style={{fontSize:"0.8rem"}}>{selectedRecord?.role}</p>
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