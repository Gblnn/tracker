import AddRecordButton from "@/components/add-record-button";
import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import Directive from "@/components/directive";
import InputDialog from "@/components/input-dialog";
import RefreshButton from "@/components/refresh-button";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { FileSpreadsheet, Laptop2, PenLine, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";


export default function Devices() {

    const [loading, setLoading] = useState(true);
    interface Device {
        id: string;
        deviceId: string;
        name: string;
        specs: {
            graphics: string;
            ram: string;
            processor: string;
        };
        assignedTo: string | null; // Reference to record ID
        created_at: Date;
        updated_at?: Date;
    }
    
    const [devices, setDevices] = useState<Device[]>([]);
    const [addDeviceDialog, setAddDeviceDialog] = useState(false);
    const [editDeviceDialog, setEditDeviceDialog] = useState(false);
    const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [newDeviceId, setNewDeviceId] = useState("");
    const [newDeviceName, setNewDeviceName] = useState("");
    const [newDeviceGraphics, setNewDeviceGraphics] = useState("");
    const [newDeviceRam, setNewDeviceRam] = useState("");
    const [newDeviceProcessor, setNewDeviceProcessor] = useState("");
    const [records, setRecords] = useState<{ id: string; name: string }[]>([]);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const { userData } = useAuth();

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const [devicesSnapshot, recordsSnapshot] = await Promise.all([
                getDocs(collection(db, "devices")),
                getDocs(collection(db, "records"))
            ]);

            const data = devicesSnapshot.docs.map((doc) => ({ 
                id: doc.id, 
                ...doc.data(),
                created_at: doc.data().created_at?.toDate() || new Date(),
                updated_at: doc.data().updated_at?.toDate()
            } as Device));
            setDevices(data);

            const recordsData = recordsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || doc.data().full_name || 'Unknown Record'
            }));
            setRecords(recordsData);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    }

    const addDevice = async () => {
        try {
            setLoading(true);
            await addDoc(collection(db, "devices"), {
                deviceId: newDeviceId,
                name: newDeviceName,
                specs: {
                    graphics: newDeviceGraphics,
                    ram: newDeviceRam,
                    processor: newDeviceProcessor
                },
                assignedTo: selectedRecordId,
                created_at: new Date()
            });
            setAddDeviceDialog(false);
            setNewDeviceId("");
            setNewDeviceName("");
            setNewDeviceGraphics("");
            setNewDeviceRam("");
            setNewDeviceProcessor("");
            setSelectedRecordId(null);
            await fetchDevices();
        } catch (error) {
            console.error("Error adding device:", error);
        } finally {
            setLoading(false);
        }
    };

    const assignDevice = async (deviceId: string, recordId: string | null) => {
        try {
            setLoading(true);
            await updateDoc(doc(db, "devices", deviceId), {
                assignedTo: recordId,
                updated_at: new Date()
            });
            await fetchDevices();
        } catch (error) {
            console.error("Error assigning device:", error);
        } finally {
            setLoading(false);
        }
    };

    const editDevice = async () => {
        if (!selectedDevice) return;
        try {
            setLoading(true);
            await updateDoc(doc(db, "devices", selectedDevice.id), {
                deviceId: newDeviceId || selectedDevice.deviceId,
                name: newDeviceName || selectedDevice.name,
                specs: {
                    graphics: newDeviceGraphics || selectedDevice.specs.graphics,
                    ram: newDeviceRam || selectedDevice.specs.ram,
                    processor: newDeviceProcessor || selectedDevice.specs.processor
                },
                assignedTo: selectedRecordId,
                updated_at: new Date()
            });
            setEditDeviceDialog(false);
            setSelectedDevice(null);
            setNewDeviceId("");
            setNewDeviceName("");
            setNewDeviceGraphics("");
            setNewDeviceRam("");
            setNewDeviceProcessor("");
            setSelectedRecordId(null);
            await fetchDevices();
        } catch (error) {
            console.error("Error editing device:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    return(
        <>
        <div style={{height:"100svh"}}>
            <Back blurBG fixed title="Devices" extra={<div style={{display: "flex", alignItems: "center", gap:"0.5rem"}}>
                <RefreshButton fetchingData={loading} onClick={fetchDevices}/>

                <button  style={{ width: "3rem", height:"2.75rem" }}>
                    <FileSpreadsheet color="forestgreen" width={"1.1rem"} />
                  </button>
                </div>}/>
            <div style={{overflowY:"auto", padding:"1.25rem", paddingTop: "5rem", gap:"0.75rem", display:"flex", flexFlow:"column"}}>
                {devices.map((device) => (
                    <Directive 
                        icon={<Laptop2 color="dodgerblue"/>}
                        key={device.id}
                        subtext={`${device.name}`} 
                        title={ device.deviceId}
                        id_subtitle={`${device.specs.graphics} | ${device.specs.ram} | ${device.specs.processor}`}
                        onClick={() => {
                            setSelectedDevice(device);
                            setDetailsDrawerOpen(true);
                        }}
                    />
                ))}
            </div>

            {/* Floating Add Button (only for admins) */}
            {userData?.system_role === "admin" && (
                <div style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "2rem",
                }}>
                    {/* <button
                        onClick={() => setAddDeviceDialog(true)}
                        style={{
                            width: "3rem",
                            height: "3rem",
                            borderRadius: "50%",
                            backgroundColor: "dodgerblue",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                        }}
                    >
                        <Plus color="white" />
                    </button> */}
                    <AddRecordButton onClick={() => setAddDeviceDialog(true)} icon={<Plus/>}/>
                </div>
            )}

            <div>
                {/* Add Device Dialog */}
                <InputDialog
                    open={addDeviceDialog}
                    title="Add Device"
                    titleIcon={<Plus color="dodgerblue" />}
                    onCancel={() => {
                        setAddDeviceDialog(false);
                        setNewDeviceId("");
                        setNewDeviceName("");
                        setNewDeviceGraphics("");
                        setNewDeviceRam("");
                        setNewDeviceProcessor("");
                        setSelectedRecordId(null);
                    }}
                    onOk={addDevice}
                    OkButtonText="Add"
                    updating={loading}
                    input1Label="Device ID"
                    inputplaceholder="Enter device ID"
                    inputOnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceId(e.target.value)}
                    input2Label="Device Name"
                    input2placeholder="Enter device name"
                    input2OnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceName(e.target.value)}
                    input3Label="Graphics Card"
                    input3placeholder="Enter graphics card specs"
                    input3OnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceGraphics(e.target.value)}
                    input4Label="RAM"
                    input4placeholder="Enter RAM specs"
                    input4OnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceRam(e.target.value)}
                    input5Label="Processor"
                    input5placeholder="Enter processor specs"
                    input5OnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceProcessor(e.target.value)}
                />
                {addDeviceDialog && (
                    <div style={{ marginTop: "1rem", padding: "0 1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Assign to Record</label>
                        <select
                            value={selectedRecordId || ""}
                            onChange={(e) => setSelectedRecordId(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc"
                            }}
                        >
                            <option value="">Select a record</option>
                            {records.map(record => (
                                <option key={record.id} value={record.id}>
                                    {record.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div>
                {/* Edit Device Dialog */}
                <InputDialog
                    open={editDeviceDialog}
                    title="Edit Device"
                    titleIcon={<PenLine color="dodgerblue" />}
                    onCancel={() => {
                        setEditDeviceDialog(false);
                        setSelectedDevice(null);
                        setNewDeviceId("");
                        setNewDeviceName("");
                        setNewDeviceGraphics("");
                        setNewDeviceRam("");
                        setNewDeviceProcessor("");
                        setSelectedRecordId(null);
                    }}
                    onOk={editDevice}
                    OkButtonText="Update"
                    updating={loading}
                    input1Label="Device ID"
                    inputplaceholder="Enter device ID"
                    inputOnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceId(e.target.value)}
                    input1Value={selectedDevice?.deviceId}
                    input2Label="Device Name"
                    input2placeholder="Enter device name"
                    input2OnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceName(e.target.value)}
                    input2Value={selectedDevice?.name}
                    input3Label="Graphics Card"
                    input3placeholder="Enter graphics card specs"
                    input3OnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceGraphics(e.target.value)}
                    input3Value={selectedDevice?.specs.graphics}
                    input4Label="RAM"
                    input4placeholder="Enter RAM specs"
                    input4OnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceRam(e.target.value)}
                    input4Value={selectedDevice?.specs.ram}
                    input5Label="Processor"
                    input5placeholder="Enter processor specs"
                    input5OnChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceProcessor(e.target.value)}
                    input5Value={selectedDevice?.specs.processor}
                />
                {editDeviceDialog && (
                    <div style={{ marginTop: "1rem", padding: "0 1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Assign to Record</label>
                        <select
                            value={selectedRecordId || ""}
                            onChange={(e) => setSelectedRecordId(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc"
                            }}
                        >
                            <option value="">Select a record</option>
                            {records.map(record => (
                                <option key={record.id} value={record.id}>
                                    {record.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Device Details Drawer */}
            <Drawer open={detailsDrawerOpen} onOpenChange={(open) => {
                if (!open) {
                    setDetailsDrawerOpen(false);
                    setSelectedDevice(null);
                }
            }}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{selectedDevice?.name || 'Device Details'}</DrawerTitle>
                        <DrawerDescription>
                            {selectedDevice?.deviceId}
                        </DrawerDescription>
                    </DrawerHeader>
                    
                    {selectedDevice && (
                        <div className="px-4 pb-4">
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                                <div className="space-y-2">
                                    <p className="flex justify-between">
                                        <span className="text-muted-foreground">Graphics:</span>
                                        <span>{selectedDevice.specs.graphics}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-muted-foreground">RAM:</span>
                                        <span>{selectedDevice.specs.ram}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-muted-foreground">Processor:</span>
                                        <span>{selectedDevice.specs.processor}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Assignment</h3>
                                <div className="space-y-4">
                                    <Select
                                        value={selectedRecordId || selectedDevice.assignedTo || ""}
                                        onValueChange={setSelectedRecordId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a record" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Not Assigned</SelectItem>
                                            {records.map(record => (
                                                <SelectItem key={record.id} value={record.id}>
                                                    {record.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {(selectedRecordId !== selectedDevice.assignedTo) && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            disabled={loading}
                                            onClick={() => assignDevice(selectedDevice.id, selectedRecordId)}
                                        >
                                            {loading ? "Assigning..." : "Assign Device"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {userData?.system_role === "admin" && (
                                <DrawerFooter className="flex-row gap-2 px-0">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setNewDeviceId(selectedDevice.deviceId);
                                            setNewDeviceName(selectedDevice.name);
                                            setNewDeviceGraphics(selectedDevice.specs.graphics);
                                            setNewDeviceRam(selectedDevice.specs.ram);
                                            setNewDeviceProcessor(selectedDevice.specs.processor);
                                            setSelectedRecordId(selectedDevice.assignedTo);
                                            setEditDeviceDialog(true);
                                            setDetailsDrawerOpen(false);
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <PenLine className="w-4 h-4" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            if (window.confirm('Are you sure you want to delete this device?')) {
                                                try {
                                                    setLoading(true);
                                                    await deleteDoc(doc(db, "devices", selectedDevice.id));
                                                    setDetailsDrawerOpen(false);
                                                    await fetchDevices();
                                                } catch (error) {
                                                    console.error("Error deleting device:", error);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                        className="flex items-center gap-2"
                                        
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </Button>
                                </DrawerFooter>
                            )}
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
        </>
    )
}