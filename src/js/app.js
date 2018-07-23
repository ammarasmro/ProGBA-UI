function resizeTitle(){
    var title = document.getElementById('title');
    title.setAttribute('style', 'color: red; padding: 1vw;');
}

function bringForward(){
    var title = document.getElementById('title');
    title.setAttribute('style', 'color: green;');
    var searchBox = document.getElementById('queryInput');
    searchBox.style.border = '0';
    searchBox.style.boxShadow = '0 4px 8px 0 rgba(0, 0, 0, 0.2)';
}

function sendBackward(){
    var title = document.getElementById('title');
    title.setAttribute('style', 'color: purple;');
    var searchBox = document.getElementById('queryInput');
    searchBox.style.border = '0.5px solid black';
    searchBox.style.boxShadow = 'none';

    var $searchResults = $('#searching-header');
    $searchResults.text('');

}

function resetAll(){
    console.log('resetAll')
    sendBackward();
    elem = document.getElementById('cards');
    elem.innerHTML = '';
}


function loadSearchResults(){
    var $searchResults = $('#searching-header');
    var $query = $('#queryInput');
    resizeTitle();
    $searchResults.text('Search results for ' + $query.val() + '...');


    // var drqaUrl = "http://localhost:5000/question/" + $query.val();

    var drqaUrl = "data/test.json";

    $.getJSON( drqaUrl , function( data ) {
        var items = [];
        var singleResults = [];
        $.each( data, function(i,k){
            // $.each(k, function( key, val ) {
            //     items.push( "<li id='" + key + "'>" + key + ": " + val + "</li>" );
            // })
            console.log(k['doc_id']);
            singleResults.push("<div class='card'>");
            singleResults.push("<div class='card-body'>");
            singleResults.push("<h5 class='card-title'>" + k['doc_id'] + "<h5/>");
            var context = k['context']
            if(context.length > 150 ) {
                context = context.substring(0,150) + "...";
                context = context + " <span><a  " +
                    "href='https://wikipedia.org/wiki/"+ k['doc_id'].split(" ").join("%20") +"'>read more.</a></span>";
            }
            singleResults.push("<p class='card-text'>" + "context" + ": " + context + "<p/>");
            // $.each(k, function( key, val ) {
            //     var shortVal = val;
            //     if(shortVal.length > 20) shortVal = shortVal.substring(1,50);
            //     // singleResults.push( "<li id='" + key + "'>" + key + ": " + shortVal + "</li>" );
            //     singleResults.push("<p class='card-text'>" + key + ": " + shortVal + "<p/>");
            // })
            singleResults.push("</div>");
            singleResults.push("<div class='card-footer d-flex justify-content-center' >");
            singleResults.push("<button role='button' onclick='putIntoPipeline(this)' name='"+ k['doc_id'].toLowerCase().split(" ").join("-") + "'>Process</button>");
            singleResults.push("</div>");
            singleResults.push("</div>");
            items.push(singleResults.join(""));
            singleResults = [];
        });
        $('#cards').append(items.join(""));
        // items.join("")
        //
        // $( "<ul/>", {
        //     "class": "drqa-responses",
        //     "id": "response",
        //     html: items.join( "" )
        // }).appendTo( "#results-list-box" );
    });

    console.log('Done loading data!');

    return false;
};

function putIntoPipeline(doc){
    alert(doc['name']);
    draw()
    elem = document.getElementById('cards');
    elem.innerHTML = '';
    summarizeTriples();
}

$('#searchForm').submit(loadSearchResults);
// $('#searchForm').onreset(resetAll);
// $('input').blur(sendBackward);

var viz;

function draw() {
    var config = {
        container_id: "viz",
        server_url: "bolt://localhost:7687",
        server_user: "neo4j",
        server_password: "ammar",
        labels: {
            //"Character": "name",
            "Subject": {
                "caption": "subjectText",
                "tags": ["test1", "test2"],
                "community": "#FFF"
                // "sizeCypher": "MATCH (n) WHERE id(n) = {id} MATCH (n)-[r]-() RETURN sum(r.weight) AS c"
            },
            "Object": {
                "caption": "objectText",
                "community": "#FFF"
            },
            "Keyword": {
                "caption": "keywordText",
                "community": "#FFF"
            }

        },
        relationships: {
            "HAS_DEFINITION": {
                "caption": false
            },
            "VERB": {
                "caption": false
            },
            "LINKS_TO": {
                "caption": false
            }
        },
        initial_cypher: "MATCH (n) -[r]-> (m) RETURN n, r, m"
        // initial_cypher: "MATCH (n) RETURN n"
    };

    viz = new NeoVis.default(config);
    viz.render();
    console.log(viz);


}


function clusterKeywords () {

    var clusterOptionsByKeyword = {
        joinCondition:function(childOptions) {

            return childOptions.group === 'Keyword';
        },
        clusterNodeProperties: {id:'keywordCluster', borderWidth:3, shape:'database'}
    };
    viz._network.cluster(clusterOptionsByKeyword);

    console.log('keywords clustered');
}

function clusterTriples () {

    var clusterOptionsByTriple = {
        joinCondition:function(childOptions) {

            return childOptions.group === 'Object' || childOptions.group === 'Subject';
        },
        clusterNodeProperties: {id:'tripleCluster', borderWidth:3, shape:'database'}
    };
    viz._network.cluster(clusterOptionsByTriple);

    console.log('triples clustered');
}

function summarizeTriples(){
    var summary = $('#summary');
    var triples = [];
    triples.push('<ul id="triples" class="list-group list-group-flush">');
    getTriples().then(result => {
        session.close();
        var triple;
        var subject;
        var relation;
        var object;
        var _idSubject;
        var _idObject;
        var _idRelation;
        result.records.forEach(rec => {
            _idSubject = rec.get('n').identity.low;
            _idRelation = rec.get('rel').identity.low;
            _idObject = rec.get('k').identity.low;
            subject = '<span class="node-'+ _idSubject +'-source" onclick="tripleSummarySelection('+ _idSubject +",'source'" +')">'+
                rec.get('n').properties.subjectText + '</span>';
            relation = '<span class="relation-'+ _idRelation +'" onclick="tripleSummarySelection('+ _idRelation +",'relation'"+')">'+
                rec.get('rel').properties.relationText + '</span>';
            object = '<span class="node-'+ _idObject +'-destination" onclick="tripleSummarySelection('+ _idObject +",'destination'"+')">'+
                rec.get('k').properties.objectText + '</span>';
            triple = subject + ' ' + relation + ' ' + object;
            triples.push('<li class="list-group-item triple">' + triple + '</li>');
        });
        triples.push('</ul>');
        summary.append(triples.join(""));
    });
}

function tripleSummarySelection(_id, nodeType){
    viz._data.nodes.update({id: _id, color: {background: 'red', border:'red'}});
    var elements = document.getElementsByClassName('node-' + _id + '-' + nodeType);

    Array.prototype.forEach.call(elements, function(elem){
       elem.style.backgroundColor = '#c4696d';

    });
}