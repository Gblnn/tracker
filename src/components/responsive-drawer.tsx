// import * as React from "react"

// import { Button } from "@/components/ui/button"
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle
// } from "@/components/ui/dialog"
// import {
//     Drawer,
//     DrawerContent,
//     DrawerFooter,
//     DrawerHeader
// } from "@/components/ui/drawer"
// import { cn } from "@/lib/utils"
// import { useMediaQuery } from "usehooks-ts"

// export function ResponsiveDrawer() {
//   const [open, setOpen] = React.useState(false)
//   const isDesktop = useMediaQuery("(min-width: 768px)")

//   if (isDesktop) {
//     return (
//       <Dialog open={open} onOpenChange={setOpen}>
//         {/* <DialogTrigger asChild >
//           <button style={{}}><FlipVertical/></button>
//         </DialogTrigger> */}
//         <DialogContent className="sm:max-w-[425px]" style={{width:"100%"}} >
//           <DialogHeader style={{width:"100%"}}>
//             <DialogTitle>Testing Responsive Drawers</DialogTitle>
//             <DialogDescription>
//               This is a test to implement responsive drawer.
//             </DialogDescription>
//           </DialogHeader>
//           <ProfileForm />
//         </DialogContent>
//       </Dialog>
//     )
//   }

//   return (
//     <Drawer open={open} onOpenChange={setOpen}>
//       {/* <DrawerTrigger asChild>
//         <button style={{}}><FlipVertical/></button>
//       </DrawerTrigger> */}
//       <DrawerContent style={{width:"100%"}}>
//         <DrawerHeader className="text-left">
//         <DialogTitle>Testing Responsive Drawers</DialogTitle>
//             <DialogDescription>
//               This is a test to implement responsive drawer.
//             </DialogDescription>
//         </DrawerHeader>
//         <ProfileForm className="px-4"/>
//         <DrawerFooter className="pt-2" >
          
//         </DrawerFooter>
//       </DrawerContent>
//     </Drawer>
//   )
// }

// function ProfileForm({ className }: React.ComponentProps<"form">) {
//   return (
//     <form className={cn("grid items-start gap-4", className)} style={{width:"100%"}}>
//       {/* <div className="grid gap-2">
//         <Label htmlFor="email">Email</Label>
//         <Input type="email" id="email" defaultValue="shadcn@example.com" />
//       </div>
//       <div className="grid gap-2">
//         <Label htmlFor="username">Username</Label>
//         <Input id="username" defaultValue="@shadcn" />
//       </div> */}
//       <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>
//       <Button type="submit">Test Button</Button>
//       <Button variant="outline" >Cancel</Button>
//       </div>
      
//     </form>
//   )
// }
