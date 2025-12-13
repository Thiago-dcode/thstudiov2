
export const CircleSelect = ({selected =false}:{
    selected?:boolean
}) => {
    console.log(selected)

    return <span className="border border-text size-4 rounded-full flex items-center justify-center p-1">{selected && <span className="size-full rounded-full bg-text "></span>}</span>
}


