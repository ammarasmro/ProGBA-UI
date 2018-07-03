const uri = 'bolt://localhost:7687';
const user = 'neo4j';
const password = 'ammar';
const driver = neo4j.v1.driver(uri, neo4j.v1.auth.basic(user, password));
const session = driver.session();

function getTriples(){
    const resultPromise = session.writeTransaction(tx => tx.run(
        'MATCH (n:Subject)-[rel:VERB]->(k:Object) RETURN n,rel,k LIMIT 30' ,
        {message: 'hello, world'}));
    return resultPromise;

}



