import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "./ui/breadcrumb";


export default function BreadCrumb(){
    return(
        <>
        <Breadcrumb style={{cursor:"pointer"}}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/"> Home</BreadcrumbLink>
        </BreadcrumbItem>
        {window.location.pathname=="/civil-ids"?
        <>
        <BreadcrumbSeparator/>
        <BreadcrumbItem>
          <BreadcrumbLink href="/civil-ids">Civil-IDs</BreadcrumbLink>
        </BreadcrumbItem>
        </>
        :""
        }
        
        
      </BreadcrumbList>
    </Breadcrumb>
        </>
    )
}
