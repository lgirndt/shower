(function(window, $) {

    $.fn.dropbox = function(options) {

        var settings = {
            'output' : '#foo',
            'dropArea' : '.dropArea',
            'slideMarkup' : '<div class="slide"><div><section></section></div></div>',
            'captionMarkup' : '<header class="caption"></header>'
        };

        var lastFiles = null;

        $.extend(settings, options);

        var openDialog = $(this);

        var ToShowerTransformer = function() {
            this.cur = null;
            this.elem = null;
            this.result = [];
            this.pageCount = 0;
        };

        ToShowerTransformer.prototype.slideEnds = function() {
            return this.elem.is('h2');
        };

        ToShowerTransformer.prototype.pushCur = function(){



            this.result.push(this.cur);
            if(this.cur.is('header.caption')){
                var extraSlide = this.createSlideMarkup(),
                    title = this.cur.find('h1').text();

                extraSlide.addClass('bg')
                        .attr('id','Cover')
                        .find('section').html('<header><h2>' + title + '</h2></header><img src="pictures/cover.jpg"/>').end()


                this.result.push(extraSlide);
            }

            this.cur = null;
        };

        ToShowerTransformer.prototype.replaceSlide = function() {
            if (this.cur != null) {
                this.pushCur();
            }
        };

        ToShowerTransformer.prototype.createSlideMarkup = function(){
            return $(settings.slideMarkup).attr('id', 'slide-' + this.pageCount++);
        };

        ToShowerTransformer.prototype.prepareNewSlide = function() {
            if (this.elem.is('h1')) {
                this.cur = $(settings.captionMarkup);
            } else {
                this.cur = this.createSlideMarkup();
            }
        };

        ToShowerTransformer.prototype.handleSlideSwitch = function() {
            if (this.slideEnds()) {
                this.replaceSlide();
            }
            if (this.cur == null) {
                this.prepareNewSlide();
            }
        };

        ToShowerTransformer.prototype.transformSingleElement = function(elem) {
            if (elem.is('h2')) {
                return $('<header></header>').append(elem);
            }
            else if (elem.is('pre')) {
                var lines = elem.children('code').text().split('\n'),
                        pre = $('<pre></pre>'),
                        i,line;

                for (i = 0; i < lines.length; i++) {
                    line = lines[i];
                    if (line.trim().length > 0) {
                        $('<code></code>').text(line).appendTo(pre);
                    }
                }
                return pre;
            }
            else {
                return elem;
            }
        };

        ToShowerTransformer.prototype.appendToCur = function(elem) {
            if (this.cur.is('header.caption')) {
                this.cur.append(elem);
            } else {
                this.cur.find('div section').append(elem);
            }
        };

        ToShowerTransformer.prototype.transform = function(text) {
            var self = this;

            $(text).each(function() {
                self.elem = $(this);
                self.handleSlideSwitch();
                self.appendToCur(self.transformSingleElement(self.elem));

            });
            this.pushCur();
            return this.result;
        };

        var MarkdownConverter = function() {

        };

        MarkdownConverter.prototype.convert = function(text) {
            var html = new Markdown.Converter().makeHtml(text);
            return new ToShowerTransformer().transform(html);
        };

        var Loader = function() {

        };

        Loader.prototype.load = function(files) {

            if(files == null){
                return null;
            }

            var reader = new FileReader();

            reader.onload = function(e) {
                var slides = new MarkdownConverter().convert(e.target.result),
                        output = $('<div></div>');

                for (var i = 0; i < slides.length; i++) {
                    output.append(slides[i]);
                }

                output.append('<div class="progress"><div></div></div>');

                $('body').append(output.html());
                openDialog.hide();

                $('html head').append('<script src="scripts/script.js"></ ' + 'script>');
            };

            if (files.length > 0) {
                reader.readAsText(files[0]);
            }

            return files;
        };


        var stopAnything = function(e) {
            e.stopPropagation();
            e.preventDefault();
        };

        var loader = new Loader();

        $(this).find(':file').change(function(e) {
            lastFiles = loader.load(e.target.files);
        });

        $(this).find(settings.dropArea)
                .bind('dragenter', function(e) {
                    stopAnything(e);
                    $(this).addClass('dragEnter')
                })
                .bind('dragexit', function(e) {
                    stopAnything(e);
                    $(this).removeClass('dragEnter');
                })
                .bind('dragover', function(e) {
                    stopAnything(e);
                })
                .bind('drop', function(e) {
                    stopAnything(e);
                    lastFiles = loader.load(e.originalEvent.dataTransfer.files);
                });

        var reloadDocument = function(){
            console.log("reload!");
            openDialog.siblings(':not(#dropbox)').remove();
            loader.load(lastFiles);
        };

        var restoreOpenDialog = function(){
            console.log('restore open dialog.');
            openDialog.show().siblings(':not(#dropbox)').remove();
        };

        $(document).keydown(function(e){
            if(e.ctrlKey){
                switch(e.which){

                    // ctrl-n
                    case 78:
                        e.preventDefault();
                        restoreOpenDialog();
                        return false;
                    // ctrl-r
                    case 82:
                        e.preventDefault();
                        reloadDocument();
                        return false;

                }
            }
        });

        return $(this);
    }
})(window, jQuery);