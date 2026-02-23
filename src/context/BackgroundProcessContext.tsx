import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface BackgroundProcess {
    id: string;
    name: string;
    status: "pending" | "in-progress" | "completed" | "error";
    message?: string;
    progress?: number; // 0-100
    startTime: number;
    endTime?: number;
}

interface BackgroundProcessContextType {
    processes: BackgroundProcess[];
    addProcess: (id: string, name: string) => void;
    updateProcess: (id: string, updates: Partial<Omit<BackgroundProcess, "id" | "name" | "startTime">>) => void;
    removeProcess: (id: string) => void;
    clearCompleted: () => void;
}

const BackgroundProcessContext = createContext<BackgroundProcessContextType | undefined>(undefined);

export function BackgroundProcessProvider({ children }: { children: ReactNode }) {
    const [processes, setProcesses] = useState<BackgroundProcess[]>([]);

    const addProcess = useCallback((id: string, name: string) => {
        setProcesses(prev => {
            // Don't add duplicate processes
            if (prev.some(p => p.id === id)) {
                return prev;
            }
            return [...prev, {
                id,
                name,
                status: "pending",
                startTime: Date.now()
            }];
        });
    }, []);

    const updateProcess = useCallback((id: string, updates: Partial<Omit<BackgroundProcess, "id" | "name" | "startTime">>) => {
        setProcesses(prev => prev.map(process => 
            process.id === id 
                ? { ...process, ...updates, endTime: updates.status === "completed" || updates.status === "error" ? Date.now() : process.endTime }
                : process
        ));
    }, []);

    const removeProcess = useCallback((id: string) => {
        setProcesses(prev => prev.filter(process => process.id !== id));
    }, []);

    const clearCompleted = useCallback(() => {
        setProcesses(prev => prev.filter(process => 
            process.status !== "completed" && process.status !== "error"
        ));
    }, []);

    return (
        <BackgroundProcessContext.Provider value={{
            processes,
            addProcess,
            updateProcess,
            removeProcess,
            clearCompleted
        }}>
            {children}
        </BackgroundProcessContext.Provider>
    );
}

export function useBackgroundProcess() {
    const context = useContext(BackgroundProcessContext);
    if (!context) {
        throw new Error("useBackgroundProcess must be used within BackgroundProcessProvider");
    }
    return context;
}
