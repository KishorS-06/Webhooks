function RequestDetails({request}){

if(!request) return <div>Select request</div>

return(

<div>

<h3>Method: {request.method}</h3>

<h4>Headers</h4>

<pre>{JSON.stringify(request.headers,null,2)}</pre>

<h4>Body</h4>

<pre>{JSON.stringify(request.body,null,2)}</pre>

</div>

)

}

export default RequestDetails