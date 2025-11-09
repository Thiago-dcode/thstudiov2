import { cn } from "@repo/ui/lib/utils";
import { ReactNode } from "react";

const Container = ({ children, className }: {
    children: ReactNode
    className?:string
}) => {

    return (
        <div className="h-full flex items-center justify-center px-4">
      <div className={cn("w-full max-w-sm",className)}>
       
            {children}
        </div>
        </div>
    );

}

const Content = ({children}:{
    children:ReactNode
}) =>{

    return ( <div className="bg-fg flex flex-col w-full justify-between items-center gap-4 rounded-xl bg-foreground py-8 px-4 inset-shadow-xs inset-shadow-fg-2">
        {children}
    </div>)
}


const Header = ({ children }: {  children?: ReactNode }) => {

    return (<div className="text-center flex flex-col items-center gap-2 ">
        {children}
    </div>)
}
const Title = ({title}:{title:string}) =>{

    return  <h1 className="text-2xl ">
    {title}
</h1>
}
const SubTitle = ({subTitle,children}:{subTitle?:string, children?:ReactNode})=>{

    return  <div className="text-sm text-text-muted">
        {subTitle? <p>{subTitle}</p>:children}
  
</div>
}
const Footer = ({ children }: { children: ReactNode }) => {

    return (<div className="mt-6 text-center text-xs text-text-muted">
        {children}
    </div>)
}
export default {
    Container,Content, Header,Title,SubTitle, Footer
}