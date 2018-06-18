<?php

include get_template_directory() . '/config/load.php';

if( ! class_exists('Pokedex')) {
  /**
  * 
  */

  class Pokedex {
    
    function __construct() {
      $this->theme_setup();
      $this->add_actions();
      $this->add_filters();
    }

    public function theme_setup() {
      global $kili_framework;
      $kili_framework->render_pages();

      register_nav_menus(array(
        'primary_navigation' => __( 'Primary Navigation', 'pokedex'),

      ));

      add_theme_support('post-thumbnails'); //add image in post
      $kili_framework->render_pages();
    }

    public function add_actions() {
      if (!is_admin()) {
				add_action( 'wp_enqueue_scripts', array($this, 'load_assets') );
      }
      
      // limit categories wordpress ----------------
      if (is_admin()) {
        add_action( 'admin_head', 'admin_inline_js' );
        function admin_inline_js(){
            echo "<script type='text/javascript'>\n";
            echo 'jQuery(document).ready(function($){
                $("#elementchecklist input:checkbox").change(function () {
                    var max = 2;
                    var count = $("#elementchecklist input:checked").length;
                    if (count > max) {
                        $(this).prop("checked", "");
                        alert("You can choose max " + max + " categor" + (max==2?"y":"ies") );
                    }
                });
            });';
            echo "\n</script>";
        }
      }
    }

    public function add_filters() {
      add_filter( 'timber_context', array( $this, 'theme_context' ) );
    }

    public function theme_context($context) {
      global $kili_framework;

      $context['page'] = new TimberPost();
      $context['theme_mods'] = get_theme_mods();
      $context['menu'] = array(
        'primary' => new TimberMenu( 'primary_navigation' )
      );
      
      if ( ! is_search() ) {
        $args = array(
          'post_type'=> 'pokemon',
          'order'    => 'ASC',
          'numberposts' => get_option( 'posts_per_page' ), // limita cantidad de post desde wordpress
        );
        $context['post_pokemon'] = get_posts( $args );
        // $post_filter['s'] = get_search_query();
      }
  
      return $context;
    } 

    public function load_assets() {
      global $kili_framework;
      wp_enqueue_style( 'theme-style', $kili_framework->asset_path( 'styles/main.css' ), false, null );
      wp_enqueue_script( 'theme-scripts', $kili_framework->asset_path('scripts/main.js'), ['jquery'], null, true );
    }  

    public function theme_translations() {

    }

  }
}

$pokedex = new Pokedex();