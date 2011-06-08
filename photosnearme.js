YUI.add('photosnearme', function(Y){

    var PhotosNearMe;
    
    // *** PhotosNearMe *** //
    
    PhotosNearMe = Y.Base.create('photosNearMe', Y.Controller, [], {
    
        // *** Prototype *** //
        
        // *** Lifecycle Methods *** //
        
        initializer : function () {
            alert('Yay!');
        }
    
    }, {});
    
    // *** Namespace *** //
    
    Y.PhotosNearMe = PhotosNearMe;

}, '0.1.0', { requires: ['app'] });
