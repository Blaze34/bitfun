class ApplicationController < ActionController::Base
  protect_from_forgery

  unless Rails.env.development?
    rescue_from Exception, :with => :exception_catcher
  end

  private

  def exception_catcher(exception)
    case exception
      when ActiveRecord::RecordNotFound, ActionController::UnknownController, ActionController::RoutingError
        render_404(exception)
      when CanCan::AccessDenied
        render_403(exception)
      else
        render_500(exception)
    end
  end

  def render_404(exception)
    exception_respond_with(404)
  end

  def render_500(exception)
    raise exception if show_detailed_exceptions?
    exception_respond_with(500)
  end

  def render_403(exception)
    exception_respond_with(403)
  end

  def exception_respond_with(status)
    respond_to do |format|
      format.html { render file: "public/#{status}", status: status, layout: false }
      format.xml { render xml: {error: status}, status: status, layout: false }
      format.json { render json: {error: status}, status: status, layout: false }
    end
  end

  def after_sign_in_path_for(resource)
    feed_path || root_path
  end

  def cookies_store
    @cookies_store ||= CookiesStore.new(cookies)
  end

  helper_method :cookies_store

end
