import { useParams } from "react-router-dom";

function EditEvent() {
  const { id } = useParams();
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Edit Event: {id}</h1>
      <p className="mt-4">Edit event functionality - coming soon</p>
    </div>
  );
}

export default EditEvent;
