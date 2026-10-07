
import {FaRegBell} from "react-icons/fa6"

export default function Navbar(){


    return(
        <div className="flex items-center justify-between position-fixed top-0 w-full border-b border-gray-400 border/70 p-3 z-10">
            <h1>Bossy</h1>
            <div>
                <input type="text" placeholder="Search for employees, emails..." className="border rounded-md p-1 text-gray-900" />
            </div>
            <div className="flex flex-row">
                <FaRegBell className="" />  
                
            </div>

        </div>
    )
}