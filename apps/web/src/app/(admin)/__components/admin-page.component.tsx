
type AdminPageContainerProps = {
    children: React.ReactNode;
};

export const AdminPageContainer = ({ children }: AdminPageContainerProps) => {
    return (
        <section className="size-full p-4 overflow-auto">
            {children}
        </section>
    );
};

type AdminPageTitleProps = {
    title: string;
    children?: React.ReactNode;
};

export const AdminPageTitle = ({ title, children }: AdminPageTitleProps) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {children}
        </div>
    );
};