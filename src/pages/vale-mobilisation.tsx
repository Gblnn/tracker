import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { Building, FilePlus, Plus, User } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";

interface MobilisationRecord {
  id: string;
  name: string;
  company: string;
  designation: string;
  category: 'Staff' | 'Management' | 'Worker';
  civilId: string;
  availability: {
    status: 'Available' | '2 Weeks Notice' | 'Unavailable';
    date?: string;
  };
  mobilisation: {
    status: 'Mobilized' | 'In Progress' | 'Not Started';
    date?: string;
  };
  medical: {
    status: 'Completed' | 'Pending' | 'Failed';
    date?: string;
  };
  induction: {
    status: 'Completed' | 'Scheduled' | 'Not Started';
    date?: string;
  };
  carTraining: {
    status: 'Certified' | 'N/A' | 'Pending';
    date?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function ValeMobilisation() {
  const [records, setRecords] = useState<MobilisationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<MobilisationRecord>>({
    name: "",
    company: "",
    designation: "",
    category: "Staff",
    civilId: "",
    availability: { status: "Available" },
    mobilisation: { status: "Not Started" },
    medical: { status: "Pending" },
    induction: { status: "Not Started" },
    carTraining: { status: "N/A" }
  });

  const handleAddRecord = async () => {
    try {
    //   const docRef = await addDoc(collection(db, "mobilisation"), {
    //     ...newRecord,
    //     createdAt: serverTimestamp(),
    //     updatedAt: serverTimestamp()
    //   });
      
      setDialogOpen(false);
      setNewRecord({
        name: "",
        company: "",
        designation: "",
        category: "Staff",
        civilId: "",
        availability: { status: "Available" },
        mobilisation: { status: "Not Started" },
        medical: { status: "Pending" },
        induction: { status: "Not Started" },
        carTraining: { status: "N/A" }
      });
    } catch (err) {
      console.error("Error adding record:", err);
      setError("Failed to add record");
    }
  };

  useEffect(() => {
    // Set up real-time listener for Firestore
    const mobilisationRef = collection(db, 'mobilisation');
    const q = query(mobilisationRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newRecords: MobilisationRecord[] = [];
        snapshot.forEach((doc) => {
          newRecords.push({ id: doc.id, ...doc.data() } as MobilisationRecord);
        });
        setRecords(newRecords);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching mobilisation records:", err);
        setError("Failed to load records");
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  return(
    <>
    <div
        style={{
          padding: "1.25rem",
          // background:
          //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
          border:""
        }}
      >
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
            <Back 
                title={"Mobilizacao"} 
                extra={
                    <div className="flex gap-2">
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md">
                                    <Plus className="h-4 w-4" />
                                    New
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Mobilisation Record</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label htmlFor="name">Name</label>
                                        <input
                                            id="name"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newRecord.name}
                                            onChange={(e) => setNewRecord(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="company">Company</label>
                                        <input
                                            id="company"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newRecord.company}
                                            onChange={(e) => setNewRecord(prev => ({ ...prev, company: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="designation">Designation</label>
                                        <input
                                            id="designation"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newRecord.designation}
                                            onChange={(e) => setNewRecord(prev => ({ ...prev, designation: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label>Category</label>
                                        <Select
                                            value={newRecord.category}
                                            onValueChange={(value: 'Staff' | 'Management' | 'Worker') => 
                                                setNewRecord(prev => ({ ...prev, category: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Staff">Staff</SelectItem>
                                                <SelectItem value="Management">Management</SelectItem>
                                                <SelectItem value="Worker">Worker</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="civilId">Civil ID</label>
                                        <input
                                            id="civilId"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newRecord.civilId}
                                            onChange={(e) => setNewRecord(prev => ({ ...prev, civilId: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label>Availability</label>
                                        <Select
                                            value={newRecord.availability?.status}
                                            onValueChange={(value: 'Available' | '2 Weeks Notice' | 'Unavailable') => 
                                                setNewRecord(prev => ({ 
                                                    ...prev, 
                                                    availability: { ...prev.availability, status: value }
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select availability" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Available">Available</SelectItem>
                                                <SelectItem value="2 Weeks Notice">2 Weeks Notice</SelectItem>
                                                <SelectItem value="Unavailable">Unavailable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAddRecord}>
                                        Add Record
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <RefreshButton/>
                    </div>
                }
            />
            <br/>
            <div style={{border:"", height:"85svh", overflowY:"auto", paddingRight:"0.5rem"}}>
                <div style={{border:"", display:"flex", justifyContent:"space-between", alignItems:"center"}} className="">
                    <h3 className="" style={{paddingLeft:"1rem"}}>{moment().format("LL")}</h3>
                    <button className="inline-flex items-center gap-2 -foreground px-4 py-2 rounded-md">
                        <FilePlus color="lightgreen" className="h-4 w-4" />
                        Export
                    </button>
                </div>

                <br/>

                <div className="rounded-lg border bg-card text-card-foreground">
                    {error && (
                        <div className="p-4 text-red-600 bg-red-50 border-b">
                            {error}
                        </div>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Civil ID</TableHead>
                                <TableHead>Availability</TableHead>
                                <TableHead>Mobilisation</TableHead>
                                <TableHead>Medical</TableHead>
                                <TableHead>Induction</TableHead>
                                <TableHead>CAR</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            Loading records...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                        No records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {record.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4" />
                                            {record.company}
                                        </div>
                                    </TableCell>
                                    <TableCell>{record.designation}</TableCell>
                                    <TableCell>
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {record.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono">{record.civilId}</span>
                                    </TableCell>
                                    <TableCell>
                                        {/* <Badge 
                                            className={
                                                record.availability.status === 'Available' 
                                                    ? "bg-green-100 text-green-800"
                                                    : record.availability.status === '2 Weeks Notice'
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                            }
                                        >
                                            {record.availability.status}
                                        </Badge> */}
                                    </TableCell>
                                    <TableCell>
                                        {/* <Badge 
                                            className={
                                                record.mobilisation.status === 'Mobilized'
                                                    ? "bg-green-100 text-green-800"
                                                    : record.mobilisation.status === 'In Progress'
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-slate-100 text-slate-800"
                                            }
                                        >
                                            {record.mobilisation.status === 'Mobilized' && <CheckCircle className="h-3 w-3 mr-1" />}
                                            {record.mobilisation.status === 'In Progress' && <Clock className="h-3 w-3 mr-1" />}
                                            {record.mobilisation.status}
                                        </Badge> */}
                                    </TableCell>
                                    <TableCell>
                                        {/* <Badge 
                                            className={
                                                record.medical.status === 'Completed'
                                                    ? "bg-green-100 text-green-800"
                                                    : record.medical.status === 'Failed'
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }
                                        >
                                            {record.medical.status}
                                        </Badge> */}
                                    </TableCell>
                                    <TableCell>
                                        {/* <Badge 
                                            className={
                                                record.induction.status === 'Completed'
                                                    ? "bg-green-100 text-green-800"
                                                    : record.induction.status === 'Scheduled'
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                            }
                                        >
                                            {record.induction.status}
                                        </Badge> */}
                                    </TableCell>
                                    <TableCell>
                                        {/* <Badge 
                                            className={
                                                record.carTraining.status === 'Certified'
                                                    ? "bg-green-100 text-green-800"
                                                    : record.carTraining.status === 'Pending'
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-slate-100 text-slate-800"
                                            }
                                        >
                                            {record.carTraining.status}
                                        </Badge> */}
                                    </TableCell>
                                    <TableCell>
                                        <button style={{color:"dodgerblue"}} className="text-sm">
                                            View Details
                                        </button>
                                    </TableCell>
                                </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </motion.div>
    </div>
    </>
  )
}