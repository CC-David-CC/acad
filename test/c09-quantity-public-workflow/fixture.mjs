// Frozen authored requests and analytic expectations; no producer imports.
export const definitions=width=>[
 {name:'width',dimension:'length',expression:width},
 {name:'height',dimension:'length',expression:'mm(20)'},
 {name:'depth',dimension:'length',expression:'mm(3)'},
 {name:'inchArea',dimension:'area',expression:'inch(1) * inch(1)'},
 {name:'inchVolume',dimension:'volume',expression:'inch(1) * inch(1) * inch(1)'},
 {name:'quarterTurn',dimension:'angle',expression:'deg(90)'},
 {name:'rectangleArea',dimension:'area',expression:'mm(10) * mm(20)'},
 {name:'rectangleVolume',dimension:'volume',expression:'rectangleArea * mm(3)'},
 {name:'ratio',dimension:'scalar',expression:'inch(2) / inch(1)'},
 {name:'copies',dimension:'count',expression:'3'},
 {name:'lengthThree',dimension:'length',expression:'mm(3)'},
 {name:'enabled',dimension:'boolean',expression:'true'}
];
export const quantities=width=>({width:['length',width,'millimeter'],height:['length',20,'millimeter'],depth:['length',3,'millimeter'],inchArea:['area',645.16,'square-millimeter'],inchVolume:['volume',16387.064,'cubic-millimeter'],quarterTurn:['angle',Math.PI/2,'radian'],rectangleArea:['area',200,'square-millimeter'],rectangleVolume:['volume',600,'cubic-millimeter'],ratio:['scalar',2,'dimensionless'],copies:['count',3,'count'],lengthThree:['length',3,'millimeter'],enabled:['boolean',true,null]});
export const failures=Object.freeze([
 ['length-plus-angle','length','mm(1) + deg(90)','DIMENSION_MISMATCH'],
 ['area-as-length','length','mm(10) * mm(20)','DIMENSION_MISMATCH'],
 ['unknown-unit','length','cm(1)','INVALID_EXPRESSION'],
 ['locale-comma','length','mm(1,5)','INVALID_EXPRESSION'],
 ['overflow-literal','length','mm(1e309)','NUMERIC_DOMAIN'],
 ['overflow-finite-domain','length','mm(1e13)','NUMERIC_DOMAIN'],
 ['division-by-zero','scalar','1 / (3 - 3)','NUMERIC_DOMAIN'],
 ['length-as-count','count','mm(3)','COUNT_DOMAIN'],
 ['fractional-count','count','3.5','COUNT_DOMAIN'],
 ['length-as-boolean','boolean','mm(3)','DIMENSION_MISMATCH'],
 ['boolean-arithmetic','scalar','true + 1','DIMENSION_MISMATCH'],
 ['unknown-parameter','length','missingQuantity','UNKNOWN_PARAMETER']
]);
export const gaps=Object.freeze(['public-formatted-area-read','public-formatted-volume-read','public-formatted-angle-read']);
export const tolerance=Object.freeze({length:1e-10,area:1e-9,volume:1e-8,angle:1e-14,scalar:1e-14,sourceCoordinate:5e-8,nativeBounds:1e-6,nativeVolume:1e-6});
