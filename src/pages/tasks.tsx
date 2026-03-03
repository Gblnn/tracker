import Back from "@/components/back";
import BottomNav from "@/components/bottom-nav";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Tasks() {
    const [tasks] = useState<any[]>([]);

    return (
        <>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                <div style={{ padding: "", position: "fixed", zIndex: 20 }}>
                    <Back
                    noback
                        blurBG
                        subtitle={tasks.length}
                        fixed
                        icon={<ClipboardList color="mediumslateblue" />}
                        title={"Tasks"}
                    />
                </div>

                <div
                    style={{
                        border: "",
                        paddingTop: "6rem",
                        paddingLeft: "1.25rem",
                        paddingRight: "1.25rem",
                        paddingBottom: "8rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        minHeight: "100svh",
                    }}
                >
                    {tasks.length === 0 ? (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "70vh",
                            }}
                        >
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia >
                                        <ClipboardList />
                                    </EmptyMedia>
                                    <EmptyTitle>No Tasks</EmptyTitle>
                                    <EmptyDescription>
                                        You don't have any tasks assigned yet.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {/* Tasks will be mapped here */}
                        </div>
                    )}
                </div>
            </motion.div>
            <BottomNav />
        </>
    );
}
