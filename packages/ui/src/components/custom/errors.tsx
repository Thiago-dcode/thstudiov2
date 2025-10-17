export const Errors = ({
    errors,
    title
}: {title:string, errors: string[] }) => {

    return (<div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm font-medium text-red-800 mb-1">{title}</p>
        <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
                <li key={index}>{error}</li>
            ))}
        </ul>
    </div>)
}