export const Errors = ({
    errors,
}: { errors: string[] }) => {

    return (<div className="">
     
        <ul className="text-base text-red-400">
            {errors.map((error, index) => (
                <li key={index}>{error}</li>
            ))}
        </ul>
    </div>)
}