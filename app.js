//se delcaran las variables necesarias llamando a las librerias express y socket io
var express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server),
    nicknames = {},
    /*Tabla es un String (que es un html) que utilizo para mantener sincronizada la aplicación, cuando la app lo requiera, actualiza
    el String en el servivor y lo envia a todos los jugadores*/
    tabla='<table id="my-table" align="center" cellspacing="0" cellpadding="0" border="0"><tbody>'+
    '<tr id="cat1"><td>Participantes</td></tr>'+
    '<tr id="cat1"><td>Nombres</td></tr>'+
    '<tr id="cat2"><td>Color</td></tr>'+
    '<tr id="cat3"><td>Fruta/Vegetal</td></tr>'+
    '<tr id="cat5"><td>Animal</td></tr>'+
    '<tr id="cat6"><td>Cosa/Objeto</td></tr>'+
    '</tbody></table>';

//le sirve el puerto por donde el servidor va a escuchar
server.listen(3000, process.env.IP);

//Rest si piden la url de inicio pues enviamos el index.html
app.get('/', function(req,res){
    res.sendfile(__dirname + '/index.html');
});

//le indicamos al servidor que en esa carpeta serviremos los archivos estaticos
app.use(express.static('archivos_estaticos'));
app.use('/static', express.static(__dirname + '/archivos_estaticos'));


//empiza lo bueno: escuchamos el evenvo connection (cuando se conecta una persona) y le pasamos una funcion de respuesta
io.sockets.on('connection', function(socket){
    setInterval(function () {

    }, 1000);
    //una funcion que escucha cuando un usuario se conecta
    socket.on('newUser',function(data,callback) {
        if(data in nicknames || /\s/.test(data) || !data){
            callback(false);
        }else{
            callback(true);
            socket.nickname = data;
            nicknames[socket.nickname]=socket.nickname;
            updateNickNames();
            console.log('esto  se puso bueno: '+tabla);
            io.sockets.socket(socket.id).emit('envio_tabla_a_nuevo_usuario',tabla);

        }
    });


    //escucho la tabla que me envian
    socket.on('envioTabla',function(data){
        tabla = data;
        socket.broadcast.emit('envioTablaARecibir',tabla);
        //io.sockets.emit('envioTablaARecibir',tabla);

    });

     socket.on('actualizo_tabla', function(data) {

         tabla = data;
    });

    //cuando esta escribiendo le manda un mensaje a todos, esta funcion recibe el envento de la linea 145 de main.js
    socket.on('estaEscribiendo', function(data){
    tabla = data.tabla;
     socket.broadcast.emit('escribiendo', {nick: data.nickname, coordenadasIdInput: data.coo, valor:data.valor, tabla:data.tabla});
    });

    socket.on('enviaLetra', function(data){
    //envia la letra a todos los usuarios
     io.sockets.emit('enviaLetraATodos', {letraParaJugar: data.letra, estadoJuego: data.estadoDelJuego });
    });


    socket.on('reinicio_juego', function(data){
    //se actualiza la tabla (string) y se envia a todos los usuarios
      tabla = data;
     io.sockets.emit('reinicio_juego', true);
    });


    socket.on('juegoTerminado', function(data){
        io.sockets.emit('juegoTerminado',data);
    });

    function updateNickNames(){
        //funcion que actualiza el numero de jugadores para todos los usuarios, cada que se conectan o se desconectan, esta función entra en acción
        io.sockets.emit('usernames',nicknames);

    }

    //cuando el usuario se desconecta elimine el usuario
    socket.on('disconnect',function(data) {

            if (!socket.nickname) {
                return;
            } else {
                delete nicknames[socket.nickname];
                io.sockets.emit('elimina_columna',socket.nickname);
                updateNickNames();


            }


    });



    socket.on('generar_resultados',function(data) {

        io.sockets.emit('generar_resultados_a_todos',true);

    });

});
