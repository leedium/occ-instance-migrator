define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {

        var MODULE_NAME = 'hc-footer';
        var moduleObj = {
            errorMessage: ko.observable(''),


            formSubmitted: ko.observable(false),
            /**
             * Runs when widget is instantiated
             */
            onLoad: function() {
                $(document).on('click', '.hc-footer--link-list li', function(){
                    if($(window).width() < 992){
                        
                        // i'm visible
                        var isVis = ($(this).parent().find('li').not(this).css('display') !== 'none');
                        
                        $('.hc-footer--link-list').removeClass('open');
                        $('.hc-footer--link-list li').each(function(){
                            if($(this).index() != 0){
                                $(this).slideUp();
                            }
                        });
                            
                        if(!isVis) {
                            if($(this).index() == 0){
                                $(this).parent().addClass('open');
                                $(this).parent().find('li').not(this).slideDown();
                            }
                        }
                        
                        
                    }
                });
                
                
                
                
                
                
                
            //     //this is just fortesting
            //      var heroCarousel = $('#acarousel');
            //      heroCarousel.find('.row').addClass('item').first().addClass('active');
            //      heroCarousel.carousel();
            //      heroCarousel.find(".right").click(function(){
            //         heroCarousel.carousel ('next');
            //     });
            //   heroCarousel.find(".left").click(function(){
            //         heroCarousel.carousel('prev');
            //     });
                
                // this is just for testing to fake the main menu while we wait for the collection to be populated
                //$(".navbar-collapse ul").append('<li><a href="#">Sale</a></li><li><a href="#">Online Exclusive</a></li><li><a href="#">What\'s New</a></li><li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Shop By Room</a><ul class="dropdown-menu"><li><a href="#">Lounge</a></li><li><a href="#">Bedroom</a></li><li><a href="#">Kitchen</a></li><li><a href="#">Bathroom</a></li><li><a href="#">Laundry</a></li><li><a href="#">Baby & Kids Room</a></li><li><a href="#">Outdoor Entertainment</a></li></ul></li><li><a href="#">Shop Fashion</a></li><li><a href="#">Shop Electronics</a></li><li><a href="#">Shop By Brand</a></li><li><a href="#">Luggage & Travel</a></li>');
                //$(".navbar-collapse ul").append('<li><a href="#">What\'s New</a></li><li><a href="#">Online Exclusives</a></li><li><a href="#">Sale</a></li><li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Shop By Room</a><ul class="dropdown-menu"><li class="dropdown dropdown-submenu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Lounge</a><ul class="dropdown-menu"><li><a href="#">Lounge 1</a></li><li><a href="#">Lounge 2</a></li><li><a href="#">Lounge 3</a></li></ul></li><li class="dropdown dropdown-submenu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Bedroom</a><ul class="dropdown-menu"><li><a href="#">Bedding Sets</a></li><li><a href="#">Kids Bedding</a></li><li><a href="#">Blankets</a></li><li><a href="#">Sheets</a></li><li><a href="#">Bedcovers & Quilts</a></li><li><a href="#">Duvet Inners & Pillows</a></li><li><a href="#">Bedding Accessories</a></li></ul></li><li class="dropdown dropdown-submenu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Kitchen</a><ul class="dropdown-menu"><li><a href="#">Kitchen 1</a></li><li><a href="#">Kitchen 2</a></li><li><a href="#">Kitchen 3</a></li></ul></li><li class="dropdown dropdown-submenu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Bathroom</a><ul class="dropdown-menu"><li><a href="#">Bathroom 1</a></li><li><a href="#">Bathroom 2</a></li><li><a href="#">Bathroom 3</a></li></ul></li><li class="dropdown dropdown-submenu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Laundry</a><ul class="dropdown-menu"><li><a href="#">Laundry 1</a></li><li><a href="#">Laundry 2</a></li><li><a href="#">Laundry 3</a></li></ul></li><li class="dropdown dropdown-submenu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Baby & Kids Room</a><ul class="dropdown-menu"><li><a href="#">Baby & Kids Room 1</a></li><li><a href="#">Baby & Kids Room 2</a></li><li><a href="#">Baby & Kids Room 3</a></li></ul></li><li class="dropdown dropdown-submenu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Outdoor Entertainment</a><ul class="dropdown-menu"><li><a href="#">Outdoor Entertainment 1</a></li><li><a href="#">Outdoor Entertainment 2</a></li><li><a href="#">Outdoor Entertainment 3</a></li></ul></li></ul></li><li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Shop Fashion</a><ul class="dropdown-menu"> <li><a href="#">Women</a></li><li><a href="#">Men</a></li><li><a href="#">Baby & Kids</a></li></ul></li><li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Shop Homeware</a><ul class="dropdown-menu"> <li><a href="#">Bedding</a></li><li><a href="#">Furniture</a></li><li><a href="#">Appliances</a></li><li><a href="#">Electronics</a></li><li><a href="#">Luggage & Travel</a></li><li><a href="#">Curtains, Floors & Décor</a></li></ul></li><li><a href="#">Shop By Brands</a></li>');
                
                // bootstrap 3rd menu level hookup
                $('ul.dropdown-menu [data-toggle=dropdown]').on('click', function (event) {
						event.preventDefault();
						event.stopPropagation();
						$(this).parent().siblings().removeClass('open');
						$(this).parent().toggleClass('open');
					});
					
			    // New accordion footer
			    $('[id*=accordionTabs] h4 a').removeClass('collapsed');
			    $('[id*=accordionTabs]').addClass('active in');
			    //console.log('Check accordions');
			    
			    $(window).resize(
                  function() {  
                    if ($(window).width() < 992) {
                    	$('[id*=accordionTabs] h4 a').addClass('collapsed');
                        $('[id*=accordionTabs]').removeClass('active in');
                        $('[id*=accordionTabs] h4 a').attr('data-toggle', 'collapse');
                    } else {
                      $('[id*=accordionTabs] h4 a').removeClass('collapsed');
                      $('[id*=accordionTabs]').addClass('active in');
                      $('[id*=accordionTabs] h4 a').removeAttr('data-toggle');
                    }
                });
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function() {
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function(element, context) {
            },

            /**
             * There is currently no validation on the live site so this will just accept
             * a valid email and will process accordingly
             */
            validateEmail: function(email) {
                var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/; 
                return re.test(String(email).toLowerCase());
            },

            onEmailSignup: function (formElement) {
                var self = this;
                this.errorMessage('');
                var emailAddress = $(formElement).find('#email').val();
                $(formElement).find('#email').removeClass('error');
                $('.EmailTXTBlock').attr('style', 'padding-bottom: 25px;');

                if(emailAddress == '' || emailAddress == undefined){
                    this.errorMessage('Email address is required');
                    $(formElement).find('#email').addClass('error');
                    $('.EmailTXTBlock').attr('style', 'padding-bottom: 25px;');
                }
                else{
                    var res = this.validateEmail(emailAddress);
                    if(!res){
                        this.errorMessage('Invalid email address');
                        $(formElement).find('#email').addClass('error');
                        $('.EmailTXTBlock').attr('style', '');
                    }
                    else{
                        $.ajax({
                        type: 'POST',
                        xhrFields: {
                            withCredentials: false
                        },
                        // url: 'https://www.pages03.net/homechoice/hcWebsite_Signup/Website_Signup?Email='+emailAddress+'&formSourceName=StandardForm&sp_exp=yes&NameSource_Campaign=Website_Signup',
                        url: this.endpointUrl().replace('$EMAIL_ADDRESS',emailAddress),
                        processData:false
                        }).done(function (data) {
                        self.formSubmitted(true);
                        }).fail(function( jqXHR, textStatus, errorThrown ) {
                        self.formSubmitted(true);
                        });
                    }
                }

            }




            //onEmailSignup: function (formElement) {
            //    var emailAddress = $(formElement).find('#email').val();
            //    var self = this;
            //    $.ajax({
            //        type: 'POST',
            //        xhrFields: {
            //            withCredentials: false
            //        },
            //        // url: 'https://www.pages03.net/homechoice/hcWebsite_Signup/Website_Signup?Email='+emailAddress+'&formSourceName=StandardForm&sp_exp=yes&NameSource_Campaign=Website_Signup',
            //        url: this.endpointUrl().replace('$EMAIL_ADDRESS',emailAddress),
            //        processData:false
            //    }).done(function (data) {
            //        self.formSubmitted(true);
            //    }).fail(function( jqXHR, textStatus, errorThrown ) {
            //        self.formSubmitted(true);
            //    });
            //}
        };
        return moduleObj;
    }

);