function RequestList({requests,onSelect}){

return(

<div>

{requests.map(req=>(

<div
key={req._id}
onClick={()=>onSelect(req)}
>

<p>{req.method}</p>

<p>{new Date(req.timestamp).toLocaleTimeString()}</p>

</div>

))}

</div>

)

}

export default RequestList