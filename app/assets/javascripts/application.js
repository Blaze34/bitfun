// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
//= require jquery.ui.all
//= require source/tagit
//= require bootstrap
//= require_tree .

$(function(){

    $('.like_button a').live("click", function(e){
        e.preventDefault();

        var link = $(this);
        $.ajax({
            url: link.attr("href"),
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Accept", "text/javascript", "*/*");
            },
            success:function(data){
                link.after(data);
                link.remove();
            },
            dataType: 'html'
        });

    });

    $("#sort").on("change", "select#interval, input:checkbox", function(){
        $(this).parents("form:first").submit();
    });

    $('#show_likes a').on('ajax:success',  function(evt, data, status, xhr){
        var $link = $(this);
        $.each(data, function(k, v){
            $link.after($("<img>").attr({
                "src": v.avatar.thumb.url,
                "class": "img-circle",
                "width": "50px"
            }));
        });
        $link.hide();
    });

    var get_tags = function( request, response ) {
        $.post("/get_tags", {tag: request.term}, function(data){
            response(data);
        }, "json");
    };

    $('#tags').tagit({tagSource:get_tags, triggerKeys:['enter', 'comma', 'tab'], maxTags:5, select: true});

});
