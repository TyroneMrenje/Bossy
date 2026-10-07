import Navbar from "../components/navbar";


export default function Home() {
  return (
    <div className="box-border scroll-smooth m-0">
      <Navbar />
      <div className="grid grid-cols-4 grid-[1fr_1fr_2fr] items-center justify-center w-full">
        <div className="flex flex-col">
            <span>Gmail</span>
            <span>Productivity</span>
            <span>LinkedIn</span>
            <span>Metrics</span>
        </div>

        <div className="flex flex-col">
          <button className="bg-blue-500 text-white rounded-md p-2">+ New Email</button>
          <span>Message Folder</span>
          <div className="flex flex-row">
             <span>All Inboxes</span>
             <span>14</span>
          </div>
         

        </div>

      </div>
    </div>
  );
}