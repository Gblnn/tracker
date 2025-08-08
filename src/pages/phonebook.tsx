import Back from "@/components/back";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { db } from "@/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { AtSign, Notebook, PhoneIcon, Search, User2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Record {
    id: string;
    name: string;
    email: string;
    contact?: string;
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
                        fontSize: "0.85rem",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}
                />
            </div>
        </div>

        <div style={{ 
            border:"",
            paddingTop: "10rem",
            marginTop: "",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            zIndex: ""
        }}>

            {filteredRecords.map((record) => (
                <Directive
                
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
            <DrawerContent>
                <div style={{ padding: "1.25rem", border:"", width:"100%",  }}>
                    <div style={{display:"flex", justifyContent:"center", alignItems:"center", padding:"1.25rem", paddingTop:"0.75rem"}}>
                        <h1>{selectedRecord?.name}</h1>
                    </div>
                    

                    <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "1rem",
                        marginTop: "",
                        width: "100%"
                    }}>
                        
                        <Directive icon={<AtSign color="dodgerblue"/>} notName title={selectedRecord?.email} />
                        
                        <Directive title={selectedRecord?.contact} icon={<PhoneIcon color="dodgerblue"/>}/>
                        
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
        </>
    )
}