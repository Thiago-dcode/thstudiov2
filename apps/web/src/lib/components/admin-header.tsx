import { MainNav } from "./main-nav.component"

export const AdminHeader = () => {

    return (<header className="h-full flex flex-col items-center justify-start  gap-10  border-r border-r-fg-2 bg-fg ">
        {/* Aside nav */}
        <div className="border-b border-b-fg-2 w-full h-16 shrink-0 flex items-center justify-center px-4">
            <p className="text-xl  text-center">A11STUDIO</p>
        </div>
        <MainNav />
    </header>)
}