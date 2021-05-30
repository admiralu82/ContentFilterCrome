<?php

$entityBody = file_get_contents('php://input');
$msg = '{ "time":"'.date("Y-m-d H:i:s")."\",".$entityBody;
//$msg = '{ "time":"'.date("20y-m-d-H-i")."\",".$entityBody;
 
file_put_contents('../stat.log',$msg."\n",FILE_APPEND );



header('Access-Control-Allow-Origin: *');
echo 'ok';
?>


