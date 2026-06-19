export const PlanHeader = ({
 name,
 description,
}: {
 name: string;
 description: string;
}) => {
 return (
 <div className="flex flex-col items-start gap-1 justify-between w-full">
 <h3 className="text-2xl font-semibold text-text">{name}</h3>
 <p className="mt-1 text-sm text-text-muted h-8">{description}</p>
 </div>
 );
};
