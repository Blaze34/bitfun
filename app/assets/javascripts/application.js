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
//= require jquery.ui.core
//= require jquery.ui.widget
//= require jquery.ui.autocomplete
//= require jquery.ui.draggable
//= require source/bootstrap-tab
//= require rails.validations

//= require source/fileupload/jquery.iframe-transport
//= require source/fileupload/jquery.fileupload
//= require source/fileupload/jquery.fileupload-ui
//= require source/fileupload/locale

//= require avatar
//= require hogan.js
//= require_tree ./templates

//= require_tree .

$(function(){

    var get_sorting_data = function(){
        var data = {
            'type' : [],
            'view' : 'list',
            'interval' : 'year'
        };

        $('.filter_obj a.active').each(function(e){
            data['type'].push($(this).data('value'))
        });
        if (!data['type'].length)
            data['type'].push("unknown");

        data['interval'] = $('#dropdown_select').data('ddslick').selectedData.value;

//        $("div.btn-group[data-type]").each(function(e){
//            var $this = $(this);
//            var type = $this.data("type");
//            switch(type) {
//                case "view":
//                    data[type] = $this.find("button.active").data("value");
//                    break;
//                case "type":
//                    data[type] = [];
//                    $this.find("button.active").each(function(){
//                        data[type].push($(this).data("value"));
//                    });
//                    if (!data[type].length)
//                        data[type].push("unknown");
//                    break;
//                case "interval":
//                    data[type] = $this.find("button").data("value");
//                    break;
//            }
//        });

//        var tags = get_tags();
//        if (tags) data["query"] = tags;

        return data;
    };

    var post_sorting_data = function(){
        $.ajax({
            type: 'POST',
            url: '/',
            data: get_sorting_data(),
            dataType: 'script'
        });
    };

    $(".filter_obj a").on("click", function(e){
        e.preventDefault();
        $(this).toggleClass('active');
        post_sorting_data()
    });

    $('#dropdown_select').ddslick({
        onSelected: function(data){
            var selected_interval = data.selectedData.value;
            if ($('#last_interval').data('value') !=  selected_interval){
                post_sorting_data();
                $('#last_interval').data('value', selected_interval)
            }
        }
    });

    $('.tumbler_switch .switch').click(function(e){
        e.preventDefault();
        var $$ = $(this);
        if($$.hasClass('active')){
            return false;
        }
        else{
            var sib = $$.siblings('a'),
                slider = sib.find('.toggle_slider'),
                cwidth = $$.outerWidth(),
                swidth = sib.outerWidth();

            function changeClass(sib, cur){
                cur.toggleClass('active');
                sib.toggleClass('active');
            }
            //            changeClass(sib, $$);
            if($$.hasClass('hold_left')){
                slider.animate({left: -cwidth, width: cwidth}, 300, function(){changeClass(sib, $$);});
            }
            else if($$.hasClass('hold_right')){
                slider.animate({left: swidth, width: cwidth}, 300, function(){changeClass(sib, $$);});
            }

            slider.animate({left: 0, width: swidth});
        }
    });

    var cache = {};
    var autocomplete_tags = function( request, response ) {
        if (request.term in cache){
            response(cache[request.term]);
        } else {
            $.post("/get_tags", {tag: request.term}, function(data){
                cache[request.term] = data;
                response(data);
            }, "json");
        }
    };

    $('.search_by_tags').tagit({tagSource: autocomplete_tags, minLength: 2, allowNewTags: false, maxTags: 5});

    var get_tags = function(){
        var tags = $('.search_by_tags').tagit("tags");
        return (tags.length) ? $.map(tags, function(tag){ return tag.value; }) : false;
    };

    $('.search_block a').click(function(e){
        e.preventDefault();
        var data = get_tags();
        if (data) window.location.href = "/search?" + $.param({query:data});
    });

    $("input.date_picker").datepicker({format:"yyyy-mm-dd"});

    $('.post_nav .like_box, .post_nav .repost_box').tooltipster({
        interactive: true,
        animation: 'fade',
        theme: 'likes_theme',
        content: '<div class="popover_content">Загружается...</div>',
        functionBefore: function(origin, continueTooltip) {
            continueTooltip();
            var isLike = origin.hasClass('like_box') ? true : false;
            var counter = parseInt(origin.parents('.post_nav').find("span." + (isLike ? 'lcnt' : 'rcnt')).text()) || 0;
            var content =  '<div class="popover_content">' + (isLike ? 'Нет голосов' : 'Нет репостов') + '</div>';
            console.log(counter);
            if (counter) {
                if (origin.data('ajax') !== 'cached') {
                    $.ajax({
                        type: 'GET',
                        url: origin.find('a.item').attr('href'),
                        success: function(data) {
                            if (data.length) content = HoganTemplates['like_tooltip'].render({ likes: counter, users: data });
                            origin.tooltipster('update', content).data('ajax', 'cached');
                        }
                    });
                }
            }
            else {
                origin.tooltipster('update', content).data('ajax', 'cached');
            }
        }
    });


    $(".post_nav").on('ajax:success', '.repost_box a.item',  function(evt, data, status, xhr) {
        if (data.success) {
            var $counter = $(this).parents('.post_nav').find("span.rcnt");
            var value = parseInt($counter.text()) || 0;
            $counter.text(value + 1);
            $(this).parent('.repost_box').addClass('active').data('ajax', 'recache')
        }
    });

    $('.post_nav').on({
        click: function(e) {
            if ($(this).data("disabled") && !$(this).data("auth"))
                return false;
            $(this).data("disabled", true);
        },
        'ajax:success':  function(evt, data, status, xhr){
            var $this = $(this);
            $this.data("disabled", false);
            var $counter = $this.parents('.post_nav').find("span.lcnt");
            var value = parseInt($counter.text()) || 0;

            if (data.type == "like") {
                $counter.text(value + 1);
                $this.data('method', 'delete').parent('.like_box').toggleClass('active')
            } else if(data.type == "unlike") {
                $counter.text(value - 1);
                $this.data('method', 'post').parent('.like_box').toggleClass('active')
            }
            $this.parent('.like_box').data('ajax', 'recache')
        }
    }, ".like_box a.item");


    // DROPDOWN SEARCH BLOCK
    var dropdown_search_link = $('[data-toggle="dropdown-search"]'),
        dropdown_search = $('.dropdown_search'),
        dropdown_profile = $('.dropdown_profile'),
        dropdown_profile_link = $('[data-toggle="dropdown-settings"]');

    dropdown_search_link.click(function(){
        if(dropdown_profile.is(':visible')){
            dropdown_profile.fadeOut('fast');
            dropdown_profile_link.parent().toggleClass('active');
        }
        $(this).parent().toggleClass('active');
        dropdown_search.fadeToggle('slow');
    });

    $('.icon-close').click(function(){
        $('.search_by_tags').tagit('reset');
    });


    // DROPDOWN SEARCH BLOCK
    dropdown_profile_link.click(function(){
        if(dropdown_search.is(':visible')){
            dropdown_search.fadeOut('fast');
            dropdown_search_link.parent().toggleClass('active');
        }
        $(this).parent().toggleClass('active');
        dropdown_profile.fadeToggle('slow');
    });

    // SHOW/HIDE SHARE
    $('.share_link').bind('click', function(e){
        e.preventDefault();
        var $$ = $(this),
            span = $$.find('span'),
            share_list = $$.parents('.orange_box').next('ul');

        if(span.hasClass('hide')){
            span.attr('class', 'show');
            share_list.slideDown('fast');
        }
        else if(span.hasClass('show')){
            span.attr('class', 'hide');
            share_list.slideUp('fast');
        }
    });


    // MASONRY JS
    $('.main_layout.grid .post_wall').imagesLoaded( function(){
        $('.main_layout.grid .post_wall').masonry({
            itemSelector : '.post_card',
            gutterWidth: 21
        });
    });
    $('.feed_layout.grid .post_wall').imagesLoaded( function(){
        $('.feed_layout.grid .post_wall').masonry({
            itemSelector : '.post_card',
            gutterWidth: 20
        });
    });

    $('a[rel~="tooltip"]').tooltipster({
        theme: 'tooltips_theme',
        offsetY: -5
    });

    // FANCYBOX
    $('.modal_link').fancybox({
        padding : 0
    });

    $('.sign_pop_up').fancybox({
        type: 'ajax',
        wrapCSS: 'sign_form',
        closeBtn: false,
        minHeight: 900,
        padding : 0
    });

    //STICKY PROFILE
    var offset = $(".sticky_profile").offset();
    var topPadding = 200;
    $(window).scroll(function() {

        if ($(window).scrollTop() > (offset.top  - 200)) {
            $(".sticky_profile").stop().animate({
                marginTop: $(window).scrollTop() - offset.top + topPadding

            }, 1000);
        }
        else {
            $(".sticky_profile").stop().animate({
                marginTop: 0
            });
        }
    });

    $(document).on('click', 'a[rel="submit"]', function(e){
        e.preventDefault();
        $(this).parents('form').submit()
    });

    $(document).on('click', 'a[data-disabled]', function(e){
        e.preventDefault();
    });

    $(document).on('click', 'a.cancel', function(e){
        e.preventDefault();
        $.fancybox.close()
    });

    $(document).on('ajax:success', '#signup, #signin', function(evt, data, status, xhr){
        if (data.success){
            window.location = data.redirect
        }
        else {
            $(this).find('.error-block').remove();
            $(this).prepend($('<div class="error-block">' + data.errors + '</div>'));
        }
    });

    $(document).on('click', '.post_object a[data-gif]', function(e){
        e.preventDefault();
        $this = $(this);
        $this.children('img').attr("src", $this.data('gif'));
        $this.removeAttr('data-gif')
    });

    $(document).on('ajax:success', 'a.follow, a.unfollow', function(evt, data, status, xhr){
        if (data.notice){
            var $this = $(this);
            if ($this.hasClass('follow')){
                $this.removeClass('follow').addClass('unfollow').data('method', 'delete')
            }
            else{
                $this.removeClass('unfollow').addClass('follow').data('method', 'post')
            }
            show_notice(data.notice)
        }
    });

    $(document).on('click', '.post_object a[data-video]', function(e){
        e.preventDefault();
        $this = $(this);
        var videoUrl = {
            youtube: 'http://www.youtube.com/embed/',
            vimeo: 'http://player.vimeo.com/video/'
        };
        var videoData = $this.data('video').split('-');
        var videoIFrame = $('<iframe />', {
            frameborder: 0,
            src: videoUrl[videoData[0]] + videoData[1] + '?wmode=opaque&autoplay=1',
            width: 500+'px',
            height: 320+'px',
            webkitAllowFullScreen: '',
            mozallowfullscreen: '',
            allowFullScreen: ''
        });
        $this.after(videoIFrame).remove()
    });

    $(document).on('click', 'a[data-auth]', function(e){
        e.preventDefault();
        show_notice('Авторизируйтесь или зарегистрируйтесь, чтобы можно было выполнять это действие.', 'error');
    });

});

function show_notice(text, type) {
    type = type || 'success'
    var n = noty({
        text: text,
        type: type,
        dismissQueue: true,
        layout: 'top',
        theme: 'defaultTheme',
        timeout: 5000
    });
}

ClientSideValidations.formBuilders['SimpleForm::FormBuilder'] = {
    add: function(element, settings, message) {
        if (element.data('valid') !== false) {
            var wrapper = element.closest(settings.wrapper_tag);
            element.addClass('error');
            var errorElement = $('<' + settings.error_tag + ' class="' + settings.error_class + '">' + message + '</' + settings.error_tag + '>');
            wrapper.append(errorElement);
        } else {
            element.parent().find(settings.error_tag + '.' + settings.error_class).text(message);
        }
    },
    remove: function(element, settings) {
        var wrapper = element.parent(settings.wrapper_tag);
        element.removeClass('error');
        wrapper.find(settings.error_tag + '.' + settings.error_class).remove();
    }
};

ClientSideValidations.formBuilders['NestedForm::SimpleBuilder'] = ClientSideValidations.formBuilders['SimpleForm::FormBuilder'];
