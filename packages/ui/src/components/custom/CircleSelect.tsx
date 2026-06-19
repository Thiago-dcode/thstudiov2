
export const CircleSelect = ({selected =false}:{
 selected?:boolean
}) => {

 return <span className="border border-text size-4 flex items-center justify-center p-1">{selected && <span className="size-full bg-text "></span>}</span>
}


