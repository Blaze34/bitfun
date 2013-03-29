class FunsController < ApplicationController
  load_and_authorize_resource
  respond_to :html
  before_filter :only_xhr_request, only: :new

  # GET /funs
  def index

    type = params[:type] ||= cookies_store[:type]
    interval = params[:interval] ||= cookies_store[:interval]

    @funs = Fun.includes(:user, :content).filter_by_type(type).sorting(params[:sort], interval: interval, sandbox: params[:sandbox])

    if params[:query]
      funs_ids = Fun.search_fun_ids(params[:query], type)
      @funs = @funs.where(id: funs_ids)
    end

    cookies_store.set params.select { |k,v| k.in? %w(type view interval sort) }

    @funs = @funs.page params[:page]

    render 'index.js.erb' if request.xhr?
  end

  def autocomplete_tags
    unless params[:tag].nil?
      tags = Fun.find_tags_by_name params[:tag]
      respond_to do |format|
        format.json { render :json => tags.collect { |tag| tag.name.to_s } }
      end
    end
  end

  def feed
    @funs = current_user.feed.includes(:user, :content, :reposts).order('created_at DESC').page params[:page]
    render 'index'
  end

  # GET /funs/1
  def show
    @funs = @fun.get_month_trends(current_user, cookies_store[:type]).includes(:user, :content)
    respond_to :html, :js
  end

  # GET /funs/new
  def new
    render layout: false
  end

  # GET /funs/1/edit
  def edit
  end

  # POST /funs
  def create
    @fun = current_user.funs.new(params[:fun])
    respond_to do |format|
      if @fun.save
        format.html { redirect_to @fun, notice: t('funs.created') }
        format.json { render json: { success: true, path: fun_path(@fun) } }
      else
        format.html { redirect_to root_path, notice: t('funs.add_error') }
        format.json { render json: { success: false, notice: t('funs.add_error') } }
      end
    end
  end

  # PUT /funs/1
  def update
    if @fun.update_attributes(params[:fun])
      redirect_to @fun, notice: t('funs.updated')
    else
      render 'edit'
    end
  end

  # DELETE /funs/1
  def destroy
    @fun.destroy
    redirect_to funs_url, notice: t('funs.deleted')
  end
end
