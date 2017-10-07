$(document).ready(function() {
    //delcaro las variables a utilizar

    var socket = io.connect();
    var chat = $('#chat');
    var users = $('#users');
    var nick = $('#nickname');
    var setNick = ('#setNick');
    var myform = $('#myform');
    var panelUsuario = $('#panelUsuario');
    var jugadores;
    var panelHeader = $('#page-header');
    var numero_categorias = 5;
    var valor_sin_enviar;
    var coordenadas;


    //funcion para generar letra aleatoria
    $('#generarLetra').click(function() {
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var letraSeleccionada = possible.charAt(Math.floor(Math.random() * possible.length));
        $('#letraSeleccionada').html("<br/>letra seleccionada = <h1 style='color:red;'>" + letraSeleccionada + "</h1>");
        var infoJuego = {
            letra: letraSeleccionada,
            estadoDelJuego: true
        };
        socket.emit('enviaLetra', infoJuego);
        $('#chat').show();

    });

    //funcion para reiniciar el juego
    $('#reiniciar_juego').click(function() {
        var $tablaClonada = $('#reinicio-tabla').clone();
        socket.emit('reinicio_juego', $tablaClonada.html());


        $("#reiniciar_juego").hide();
        $('#botonGenerarResultados').hide();
    })

    //Socket> escucha cuando alguien reinicio el juego
    socket.on('reinicio_juego', function(data) {

        var $tablaClonada = $('#reinicio-tabla').clone();
        //preparo la interfaz para un nuevo juego
        $('#chat').html($tablaClonada.html());
        recorrer_tabla_para_estilizarla();
        

        $("#divResultados").hide();
        $('#botonStop').show();
        $('#botonStop').prop('disabled', true);

    })

    //alguien da Stop en el juego, esta opcion solo se habilita cuando ha ingresado valores en todas las categorías
    $('#botonStop').click(function() {
        //Socekt>emit para avisarle a los jugadores que el juego ha terminado
        socket.emit('juegoTerminado', nick.val());
    });

    //alguien genero los resultados
    $('#botonGenerarResultados').click(function() {
        socket.emit('generar_resultados', true);

    });

    //genera los resultados, esto arma una tabla con el usuario y al lado el puntaje que ingreso 
    socket.on('generar_resultados_a_todos', function(data) {
        $("#tablaResultados").show();
        $('#tablaResultados tbody').html('');
        $('#my-table tbody tr:last').find(':input').each(function(index) {
            var usuario = $(this).attr('class')
            var resultado = $(this).val();
            $('#tablaResultados tbody').append(`<tr><td> ${usuario}</td><td>${resultado}</td></tr>`);
        });

        $("#divResultados").show();
        //INICIALIZO LA TABLA ORDENADA

        //utilice un plugin para ordenar la tabla de mayor a menor dependiendo el puntaje
        if ($.fn.dataTable.isDataTable('#tablaResultados')) {
            $('#tablaResultados').DataTable();
        } else {
            $('#tablaResultados').DataTable({
                paging: false,
                searching: false,
                "order": [
                    [1, 'desc']
                ],
                "language": {
                    "lengthMenu": "Display _MENU_ records per page",
                    "zeroRecords": "No encontro ningun registro, intenta de nuevo",
                    "info": "Mostrando  _PAGE_ pagina de _PAGES_",
                    "infoEmpty": "No hay registros en la tabla",
                    "infoFiltered": "(filtered from _MAX_ total records)"
                }
            });
        }
    });


    /*cuando se haga click al ingresar el usuario, se verifica que no
    exista uno repetido o que tenga espacion en el nickname y se muestra el juego*/
    $("#nickContainer").on('click', '#setNick', function() {
        
        if( !nick.val()) {
          $('#login-vacio').show();
          $('#login-error').hide();
        }else{
        socket.emit('newUser', nick.val(), function(data) {
            if (data) {
                //esconde el loguin y muestra la interfaz del juego
                $('#nickContainer').hide();
                $('#content').show();
                $('#botonStop').prop('disabled', true);
                $('#login-error').hide();
                $('#login-vacio').hide();
                $("#divResultados").hide();
                $("#reiniciar_juego").hide();
                $('#botonGenerarResultados').hide();

            } else {
                $('#login-error').show();
                $('#login-vacio').hide();
            }

            //
            $(`#chat `).on("focusout", `input.${nick.val()}`, function() {
                /*esto se ejecuta cuando el usuario pasa a una nueva categoria o por algun motivo cambia de input donde estaba escribiendo
                el desarrollador asumio que esto sucede a medida que avanza en llenar los campos del juego, y desencadena una serie de eventos
                descritos acontinuación*/
                
                
                /* clona la tabla a un div escondido (display none) que se llama procesamiento tabla, la funcion de esta tabla
                es tener una tabla sincronizada para todo el juego, ya que la tabla del usuario se ve modificada con factores como esconder las respuestas del rival*/
                
                var $tablaClonada = $('#chat').clone();
                $("#procesamiento-tabla").html($tablaClonada.html())
                limpio_tabla_para_crear_interfaz_general();
                var $tablaClonada = $('#procesamiento-tabla').clone();

                //socket> manda los valores nuevos de la tabla a todos los usuarios
                socket.emit('estaEscribiendo', {
                    nickname: nick.val(),
                    coo: coordenadas,
                    valor: valor_sin_enviar,
                    tabla: $tablaClonada.html()
                });


                //recorro y compruebo si hay campos vacios en mi columna --#chat #my-table input.${nick.val()}----, si mi columna esta llena, puedo unir stop, de lo contrario no
                var camposVacios = 0;
                $(`#chat #my-table input.${nick.val()}`).each(function() {
                    if ($.trim($(this).val()) == "") {
                        camposVacios++;
                    }

                });
                if (camposVacios > 0) $('#botonStop').prop('disabled', true);
                else $('#botonStop').prop('disabled', false);

            });


        });
        //se agrega el nombre al header del juego
        panelHeader.html(`<h1>Stop Online<small> Desarrolado por Intuitiva  </small></h1>
        <h3>Usuario: <small style="color: #0CDBFF;"> ${nick.val()}</small></h3>`);
        }
    });

    socket.on('escribiendo', function(data) {
        console.log('data.coordenadasIdInput = ' + data.coordenadasIdInput);
        console.log('data.valor = ' + data.valor);
        $(`#${data.coordenadasIdInput}`).attr('value', data.valor);
        $(`#${data.coordenadasIdInput}`).val(data.valor);

        recorrer_tabla_para_estilizarla();

    });
    socket.on('juegoTerminado', function(data) {
        $('#reiniciar_juego').show();
        $('#botonGenerarResultados').show();
        $('#botonStop').hide();


        //clono una tabla escondida (display none) por si quieren reiniciar el juego la tabla se compone de un numero de columnas segun un número de jugadores
        
        var $tablaClonada = $('#chat').clone();
        $("#reinicio-tabla").html($tablaClonada.html());
        $("#reinicio-tabla input").each(function() {
            $(this).attr('type', 'text');
            $(this).removeClass('input-enemigo');
            $(this).prop('disabled', false);
            $(this).removeAttr('value');
            $(this).removeAttr("size");

            //Maximo de caracteres
        });
        /*si alguien undió Stop el juego ha terminado, por lo tanto los input se convierten en <p> con lo que en ese momento se haya escrito*/
        $('#chat #my-table *').filter(':input:not("#resultados")').each(function() {
            var id = $(this).attr('id');
            var value = `<p id =${id}>` + $(this).val() + "</p>";
            $(this).replaceWith(value);


        });


        //agregue fila de resultados
        //clono la ultima columna, le quito los id duplicados y limpio el input
        $('#chat #my-table tbody').append($("#my-table tbody tr:last").clone(false));
        $('#chat #my-table tbody tr:last td:first').html('Tus Resultados');
        $('#chat #my-table tbody tr:last').attr("id", "resultados");
        $('#chat #my-table tbody tr:last').find('p').each(function(index) {
            var id = $(this).attr('id');
            id = id.slice(0, -1);
            $(this).replaceWith(`<input class="${id}" id="${id}" size="5"></input>`)

        });
        $(`#chat #my-table tbody tr:last input:not(.${nick.val()}) `).each(function() {
            $(this).prop("disabled", true);
        });


        $('#chat #my-table tbody tr:last td input').val("");



    });
    //envia la letra que alguien genero, a todos los usuarios conectados
    socket.on('enviaLetraATodos', function(data) {
        var letraRandom = data.letraParaJugar;
        $('#letraSeleccionada').html("<br/>letra seleccionada = <h1 style='color:red;'>" + letraRandom + "</h1>");
    });




    /* este evento esta todo lo relacionado con usuarios*/
    socket.on("usernames", function(data) {

        var usernamesString = "";
        jugadores = data;

        //se recorre los jugadores conectados para agregarlos al box de jugadores
        for (var username in data) {
            usernamesString += username + "<br/>";
        }
        //los agrega al panel de usuarios
        users.html(usernamesString);

    });
    $(`body`).on("keyup", 'input', function(e) {
        if (!$('#nickname').is(':focus')) {
            if (e.keyCode == 13) {
                var myIndex = $(this).index("table :text");
                var nextTextbox = $("table :text:eq(" + (myIndex + 1) + ")");

                // checking
                while (nextTextbox.is(':disabled')) {
                    myIndex++;
                    var nextTextbox = $("table :text:eq(" + (myIndex + 1) + ")");
                }
                nextTextbox.focus();
            } else if (e.keyCode == 9) {

            } else {

                $(':focus').attr('value', $(this).val());
                valor_sin_enviar = $(':focus').val();
                coordenadas = $(':focus').attr('id');

            }




        }
    });

    socket.on('envio_tabla_a_nuevo_usuario', function(data) {
        $('#chat').html(data);
        appendColumn();
        var $tablaClonada = $('#chat').clone();
        socket.emit('envioTabla', $tablaClonada.html());
        $("#procesamiento-tabla").html($tablaClonada.html())
        recorrer_tabla_para_estilizarla();


    });
    //tabla actualizada que reciben todos
    socket.on('envioTablaARecibir', function(data) {
        $('#chat').html(data);
        recorrer_tabla_para_estilizarla();
        var $tablaClonada = $('#chat').clone();
        $("#procesamiento-tabla").html($tablaClonada.html())
        limpio_tabla_para_crear_interfaz_general();


    });

    socket.on('elimina_columna', function(data) {
        deleteColumns(data)
        var $tablaClonada = $('#chat').clone();
        $("#procesamiento-tabla").html($tablaClonada.html())

        limpio_tabla_para_crear_interfaz_general();
        $tablaClonada = $('#procesamiento-tabla').clone();
        socket.emit('actualizo_tabla', $tablaClonada.html());
    });

    
    // create DIV element and append to the table cell
    function createCell(cell, element, id, i) {

        if (element == "input") {
            //var div = document.createElement('div'), // create DIV element
            var elementCreado = document.createElement(element); // create text nodediv.appendChild(inputCreado); // append text node to the DIV
            elementCreado.setAttribute('class', id); // set DIV class attribute
            elementCreado.setAttribute('id', id + i); // set DIV class attribute for IE (?!)
            cell.appendChild(elementCreado); // append DIV to the table cell
        } else if (element == "text") {
            var elementCreado = document.createElement("p");
            var texto = document.createTextNode(nick.val());
            elementCreado.appendChild(texto);
            elementCreado.setAttribute("class", ` ${nick.val()}`);
            cell.appendChild(elementCreado);
        }


    }

    function appendRow() {

        var tbl = document.getElementById('my-table'), // table reference
            row = tbl.insertRow(tbl.rows.length),
                 // append table row
            i;
        // insert table cells to the new row
        for (i = 0; i < tbl.rows[0].cells.length; i++) {
            createCell(row.insertCell(i), 'input', 'row');
        }
    }

    function appendColumn() {

        var tbl = document.getElementById('my-table');
        var i;
        createCell(tbl.rows[0].insertCell(tbl.rows[0].cells.length), 'text', nick.val(), 0)
        for (i = 1; i < tbl.rows.length; i++) {
            createCell(tbl.rows[i].insertCell(tbl.rows[i].cells.length), 'input', nick.val(), i);

            //createCell(tbl.rows[i].insertCell(tbl.rows[i].cells.length), 'input', nick.val(),i);
        }
    }

    function deleteColumns(data) {    
        $(`#my-table .${data}`).remove();
    }
    
    function recorrer_tabla_para_estilizarla() {
       $(`#chat #my-table input:not(.${nick.val()})`).each(function() {
            if ($(this).val() && $(this).parent().parent().attr('id') != "resultados") {
                $(this).attr('type', 'password');
                $(this).addClass('input-enemigo');
            }
            $(this).prop('disabled', true);
            $(this).attr('size', 3);

        })
    }
    
    function limpio_tabla_para_crear_interfaz_general() {
       $("#procesamiento-tabla input").each(function() {
                    $(this).attr('type', 'text');
                    $(this).removeClass('input-enemigo');
                    $(this).prop('disabled', false);
                    $(this).removeAttr("size");
        });
    }



});